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

module.exports = { uploadZipToBranch };
