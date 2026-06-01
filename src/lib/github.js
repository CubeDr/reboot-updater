const { request } = require("undici");

const API_ROOT = "https://api.github.com";

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
  const data = await githubRequest(token, "GET", `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  return data.object.sha;
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

function shouldPreservePath(path, preservePaths) {
  return preservePaths.some((preservePath) => path === preservePath || path.startsWith(`${preservePath}/`));
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

async function publishHomepageFiles({ token, owner, repo, files, summary, preservePaths }) {
  const currentMainSha = await getBranchSha({ token, owner, repo, branch: "main" });
  const currentMainCommit = await getCommit({ token, owner, repo, sha: currentMainSha });
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
    message: `Update homepage (${summary.fileCount} files, ${summary.totalBytes} bytes)`,
    tree: newTree.sha,
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

async function listRecentMainCommits({ token, owner, repo, limit = 8 }) {
  const commits = await githubRequest(
    token,
    "GET",
    `/repos/${owner}/${repo}/commits?sha=main&per_page=${encodeURIComponent(String(limit))}`,
  );

  return commits.map((commit) => ({
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    message: commit.commit.message.split("\n")[0],
    date: commit.commit.author.date,
    author: commit.commit.author.name,
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

module.exports = { listRecentMainCommits, publishHomepageFiles, restoreMainToCommit };
