require("dotenv").config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  port: Number(process.env.PORT || 3000),
  adminPassword: required("ADMIN_PASSWORD"),
  sessionSecret: required("SESSION_SECRET"),
  githubToken: required("GITHUB_TOKEN"),
  githubOwner: process.env.GITHUB_OWNER || "CubeDr",
  homepageRepo: process.env.HOMEPAGE_REPO || "reboot-homepage",
  zipBranch: process.env.ZIP_BRANCH || "zip",
  zipPath: process.env.ZIP_PATH || "site.zip",
  maxZipBytes: Number(process.env.MAX_ZIP_BYTES || 50 * 1024 * 1024),
  maxUnzippedBytes: Number(process.env.MAX_UNZIPPED_BYTES || 250 * 1024 * 1024),
  maxZipFiles: Number(process.env.MAX_ZIP_FILES || 5000),
};

module.exports = { config };
