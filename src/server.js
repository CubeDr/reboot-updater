const express = require("express");
const multer = require("multer");
const cookieParser = require("cookie-parser");

const { clearSession, requireAuth, setSession } = require("./auth");
const { config } = require("./config");
const { listRecentMainCommits, restoreMainToCommit, uploadZipToBranch } = require("./github");
const { validateZip } = require("./zip");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxZipBytes, files: 1 },
});

app.set("view engine", "ejs");
app.set("views", `${__dirname}/../views`);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(`${__dirname}/../public`));

app.get("/", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  if (req.body.password !== config.adminPassword) {
    res.status(401).render("login", { error: "비밀번호가 올바르지 않습니다." });
    return;
  }

  setSession(res, config.sessionSecret);
  res.redirect("/dashboard");
});

app.post("/logout", (req, res) => {
  clearSession(res);
  res.redirect("/");
});

async function renderDashboard(res, options = {}) {
  let deployments = [];
  let historyError = null;

  try {
    deployments = await listRecentMainCommits({
      token: config.githubToken,
      owner: config.githubOwner,
      repo: config.homepageRepo,
    });
  } catch (error) {
    historyError = error.message;
  }

  res.render("dashboard", {
    deployments,
    historyError,
    error: options.error || null,
    result: options.result || null,
    restore: options.restore || null,
    config,
  });
}

app.get("/dashboard", requireAuth(config.sessionSecret), async (req, res) => {
  await renderDashboard(res);
});

app.post("/upload", requireAuth(config.sessionSecret), upload.single("homepageZip"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("zip 파일을 선택해주세요.");
    }
    if (req.file.mimetype !== "application/zip" && !req.file.originalname.endsWith(".zip")) {
      throw new Error("zip 파일만 업로드할 수 있습니다.");
    }

    const summary = await validateZip(req.file.buffer, {
      maxZipFiles: config.maxZipFiles,
      maxUnzippedBytes: config.maxUnzippedBytes,
    });

    const result = await uploadZipToBranch({
      token: config.githubToken,
      owner: config.githubOwner,
      repo: config.homepageRepo,
      branch: config.zipBranch,
      path: config.zipPath,
      zipBuffer: req.file.buffer,
      summary,
    });

    await renderDashboard(res, {
      result: {
        commitUrl: result.commit.html_url,
        branch: config.zipBranch,
        fileCount: summary.fileCount,
        totalBytes: summary.totalBytes,
        topLevelNames: summary.topLevelNames,
      },
    });
  } catch (error) {
    res.status(400);
    await renderDashboard(res, {
      error: error.message,
    });
  }
});

app.post("/restore", requireAuth(config.sessionSecret), async (req, res) => {
  try {
    const result = await restoreMainToCommit({
      token: config.githubToken,
      owner: config.githubOwner,
      repo: config.homepageRepo,
      targetSha: req.body.sha,
    });

    await renderDashboard(res, {
      restore: {
        commitUrl: result.url,
        shortSha: result.shortSha,
      },
    });
  } catch (error) {
    res.status(400);
    await renderDashboard(res, {
      error: error.message,
    });
  }
});

app.listen(config.port, () => {
  console.log(`reboot-updater listening on http://localhost:${config.port}`);
});
