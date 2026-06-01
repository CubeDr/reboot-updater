const { request } = require("undici");

const API_ROOT = "https://api.github.com";
const UPDATER_PREFIX = "UPDATER: ";

function branchRefPath(branch) {
  return branch
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function githubRequest(token, method, path, body) {
  const response = await request(`${API_ROOT}${path}`, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "reboot-updater",
      "x-github-api-version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.body.text();
  const data = text ? JSON.parse(text) : null;

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const message = data && data.message ? data.message : text;
    throw new Error(`GitHub API ${method} ${path} failed: ${response.statusCode} ${message}`);
  }

  return data;
}

async function getBranchSha({ token, owner, repo, branch }) {
  const data = await githubRequest(token, "GET", `/repos/${owner}/${repo}/git/ref/heads/${branchRefPath(branch)}`);
  return data.object.sha;
}

async function ensureBranch({ token, owner, repo, branch, fallbackBranch = "main" }) {
  try {
    return await getBranchSha({ token, owner, repo, branch });
  } catch (error) {
    if (!String(error.message).includes("404")) {
      throw error;
    }
  }

  const fallbackSha = await getBranchSha({ token, owner, repo, branch: fallbackBranch });
  await githubRequest(token, "POST", `/repos/${owner}/${repo}/git/refs`, {
    ref: `refs/heads/${branch}`,
    sha: fallbackSha,
  });
  return fallbackSha;
}

async function getCommit({ token, owner, repo, sha }) {
  return githubRequest(token, "GET", `/repos/${owner}/${repo}/git/commits/${sha}`);
}

async function getRecursiveTree({ token, owner, repo, treeSha }) {
  const data = await githubRequest(
    token,
    "GET",
    `/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
  );
  return data.tree || [];
}

async function getBranchSummary({ token, owner, repo, branch, excludePaths = [] }) {
  try {
    const sha = await getBranchSha({ token, owner, repo, branch });
    const commit = await getCommit({ token, owner, repo, sha });
    const tree = await getRecursiveTree({ token, owner, repo, treeSha: commit.tree.sha });
    const files = tree.filter((entry) => entry.type === "blob" && !shouldPreservePath(entry.path, excludePaths));

    const message = displayCommitMessage(commit.message.split("\n")[0]);

    return {
      exists: true,
      sha,
      shortSha: sha.slice(0, 7),
      fileCount: files.length,
      message,
      fullMessage: commit.message,
      url: `https://github.com/${owner}/${repo}/commit/${sha}`,
    };
  } catch (error) {
    if (String(error.message).includes("404")) {
      return { exists: false };
    }
    throw error;
  }
}

function shouldPreservePath(path, preservePaths) {
  return preservePaths.some((preservePath) => path === preservePath || path.startsWith(`${preservePath}/`));
}

function displayCommitMessage(message) {
  return String(message || "").startsWith(UPDATER_PREFIX)
    ? String(message).slice(UPDATER_PREFIX.length)
    : String(message || "");
}

async function createBlob({ token, owner, repo, content }) {
  const blob = await githubRequest(token, "POST", `/repos/${owner}/${repo}/git/blobs`, {
    content: content.toString("base64"),
    encoding: "base64",
  });
  return blob.sha;
}

async function createTreeFromFiles({ token, owner, repo, files, preserveEntries }) {
  const uploadedEntries = [];

  for (const [path, content] of files.entries()) {
    const sha = await createBlob({ token, owner, repo, content });
    uploadedEntries.push({
      path,
      mode: "100644",
      type: "blob",
      sha,
    });
  }

  const tree = [...uploadedEntries, ...preserveEntries];
  return githubRequest(token, "POST", `/repos/${owner}/${repo}/git/trees`, { tree });
}

async function commitFilesToBranch({
  token,
  owner,
  repo,
  branch,
  files,
  message,
  preservePaths = [],
  fallbackBranch = "main",
}) {
  const currentBranchSha = await ensureBranch({ token, owner, repo, branch, fallbackBranch });
  const currentMainCommit = await getCommit({ token, owner, repo, sha: currentBranchSha });
  const currentTree = await getRecursiveTree({ token, owner, repo, treeSha: currentMainCommit.tree.sha });

  const preserveEntries = currentTree
    .filter((entry) => entry.type === "blob" && shouldPreservePath(entry.path, preservePaths))
    .map((entry) => ({
      path: entry.path,
      mode: entry.mode || "100644",
      type: "blob",
      sha: entry.sha,
    }));

  const newTree = await createTreeFromFiles({ token, owner, repo, files, preserveEntries });
  const newCommit = await githubRequest(token, "POST", `/repos/${owner}/${repo}/git/commits`, {
    message,
    tree: newTree.sha,
    parents: [currentBranchSha],
  });

  await githubRequest(token, "PATCH", `/repos/${owner}/${repo}/git/refs/heads/${branchRefPath(branch)}`, {
    sha: newCommit.sha,
    force: false,
  });

  return {
    sha: newCommit.sha,
    shortSha: newCommit.sha.slice(0, 7),
    url: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
  };
}

function withPreviewMetadata(files, previewCname) {
  const nextFiles = new Map(files);
  nextFiles.set(".nojekyll", Buffer.from(""));

  if (previewCname) {
    nextFiles.set("CNAME", Buffer.from(`${previewCname}\n`));
  }

  return nextFiles;
}

function buildCommitMessage(prefix, changeSummary, details) {
  const safeSummary = String(changeSummary || "").trim();
  const subject = `${UPDATER_PREFIX}${safeSummary || prefix}`;

  if (!details) return subject;
  return `${subject}\n\n${details}`;
}

async function publishPreviewFiles({ token, owner, repo, branch, files, summary, previewCname, changeSummary }) {
  return commitFilesToBranch({
    token,
    owner,
    repo,
    branch,
    files: withPreviewMetadata(files, previewCname),
    message: buildCommitMessage("Preview homepage update", changeSummary, `${summary.fileCount} files, ${summary.totalBytes} bytes`),
  });
}

async function publishHomepageFiles({ token, owner, repo, files, summary, preservePaths }) {
  return commitFilesToBranch({
    token,
    owner,
    repo,
    branch: "main",
    files,
    message: `Update homepage (${summary.fileCount} files, ${summary.totalBytes} bytes)`,
    preservePaths,
  });
}

async function promotePreviewToHomepage({
  token,
  owner,
  previewRepo,
  previewBranch,
  homepageRepo,
  preservePaths,
  previewOnlyPaths,
}) {
  const previewSha = await getBranchSha({ token, owner, repo: previewRepo, branch: previewBranch });
  const previewCommit = await getCommit({ token, owner, repo: previewRepo, sha: previewSha });
  const previewTree = await getRecursiveTree({ token, owner, repo: previewRepo, treeSha: previewCommit.tree.sha });

  const files = new Map();
  for (const entry of previewTree) {
    if (entry.type !== "blob") continue;
    if (shouldPreservePath(entry.path, previewOnlyPaths)) continue;

    const blob = await githubRequest(token, "GET", `/repos/${owner}/${previewRepo}/git/blobs/${entry.sha}`);
    files.set(entry.path, Buffer.from(blob.content.replace(/\n/g, ""), "base64"));
  }

  return commitFilesToBranch({
    token,
    owner,
    repo: homepageRepo,
    branch: "main",
    files,
    message: buildCommitMessage(
      "Publish homepage",
      displayCommitMessage(previewCommit.message.split("\n")[0]),
      `Promoted from ${previewRepo}/${previewBranch}@${previewSha.slice(0, 7)}`,
    ),
    preservePaths,
  });
}

async function listRecentMainCommits({ token, owner, repo, limit = 8 }) {
  const commits = await githubRequest(
    token,
    "GET",
    `/repos/${owner}/${repo}/commits?sha=main&per_page=${encodeURIComponent(String(limit))}`,
  );

  return commits
    .filter((commit) => commit.commit.message.startsWith(UPDATER_PREFIX))
    .map((commit) => ({
      sha: commit.sha,
      shortSha: commit.sha.slice(0, 7),
      message: displayCommitMessage(commit.commit.message.split("\n")[0]),
      fullMessage: commit.commit.message,
      date: commit.commit.author.date,
      url: commit.html_url,
    }));
}

async function restoreMainToCommit({ token, owner, repo, targetSha }) {
  if (!/^[0-9a-f]{40}$/i.test(targetSha)) {
    throw new Error("복원할 커밋 정보가 올바르지 않습니다.");
  }

  const currentMainSha = await getBranchSha({ token, owner, repo, branch: "main" });
  const targetCommit = await getCommit({ token, owner, repo, sha: targetSha });

  const newCommit = await githubRequest(token, "POST", `/repos/${owner}/${repo}/git/commits`, {
    message: `Restore homepage to ${targetSha.slice(0, 7)}`,
    tree: targetCommit.tree.sha,
    parents: [currentMainSha],
  });

  await githubRequest(token, "PATCH", `/repos/${owner}/${repo}/git/refs/heads/main`, {
    sha: newCommit.sha,
    force: false,
  });

  return {
    sha: newCommit.sha,
    shortSha: newCommit.sha.slice(0, 7),
    url: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
  };
}

module.exports = {
  getBranchSummary,
  listRecentMainCommits,
  promotePreviewToHomepage,
  publishHomepageFiles,
  publishPreviewFiles,
  restoreMainToCommit,
};
