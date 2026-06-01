const express = require("express");
const multer = require("multer");
const cookieParser = require("cookie-parser");

const { clearSession, requireAuth, setSession } = require("./auth");
const { config } = require("./config");
const { uploadZipToBranch } = require("./github");
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

app.get("/dashboard", requireAuth(config.sessionSecret), (req, res) => {
  res.render("dashboard", {
    error: null,
    result: null,
    config,
  });
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

    res.render("dashboard", {
      error: null,
      result: {
        commitUrl: result.commit.html_url,
        branch: config.zipBranch,
        fileCount: summary.fileCount,
        totalBytes: summary.totalBytes,
        topLevelNames: summary.topLevelNames,
      },
      config,
    });
  } catch (error) {
    res.status(400).render("dashboard", {
      error: error.message,
      result: null,
      config,
    });
  }
});

app.listen(config.port, () => {
  console.log(`reboot-updater listening on http://localhost:${config.port}`);
});
