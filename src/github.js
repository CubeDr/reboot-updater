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

async function ensureBranchFromMain({ token, owner, repo, branch }) {
  try {
    return await getBranchSha({ token, owner, repo, branch });
  } catch (error) {
    if (!String(error.message).includes("404")) {
      throw error;
    }
  }

  const mainSha = await getBranchSha({ token, owner, repo, branch: "main" });
  await githubRequest(token, "POST", `/repos/${owner}/${repo}/git/refs`, {
    ref: `refs/heads/${branch}`,
    sha: mainSha,
  });
  return mainSha;
}

async function getExistingFileSha({ token, owner, repo, branch, path }) {
  try {
    const data = await githubRequest(
      token,
      "GET",
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,
    );
    return data.sha;
  } catch (error) {
    if (String(error.message).includes("404")) return null;
    throw error;
  }
}

async function uploadZipToBranch({ token, owner, repo, branch, path, zipBuffer, summary }) {
  await ensureBranchFromMain({ token, owner, repo, branch });
  const sha = await getExistingFileSha({ token, owner, repo, branch, path });

  const payload = {
    message: `Upload homepage zip (${summary.fileCount} files, ${summary.totalBytes} bytes)`,
    content: zipBuffer.toString("base64"),
    branch,
  };

  if (sha) payload.sha = sha;

  return githubRequest(token, "PUT", `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, payload);
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
  const targetCommit = await githubRequest(token, "GET", `/repos/${owner}/${repo}/git/commits/${targetSha}`);

  if (targetCommit.tree.sha) {
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

  throw new Error("대상 커밋의 파일 트리를 찾을 수 없습니다.");
}

module.exports = { listRecentMainCommits, restoreMainToCommit, uploadZipToBranch };
