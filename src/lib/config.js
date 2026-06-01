function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalFrom(names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }

  const prefixedBlobTokenName = Object.keys(process.env).find((name) => name.startsWith("BLOB_READ_WRITE_TOKEN_"));
  if (prefixedBlobTokenName) {
    return process.env[prefixedBlobTokenName];
  }

  return "";
}

function getConfig() {
  return {
    adminPassword: required("ADMIN_PASSWORD"),
    sessionSecret: required("SESSION_SECRET"),
    githubToken: required("GITHUB_TOKEN"),
    blobReadWriteToken: optionalFrom(["BLOB_READ_WRITE_TOKEN", "VERCEL_BLOB_READ_WRITE_TOKEN"]),
    githubOwner: process.env.GITHUB_OWNER || "CubeDr",
    homepageRepo: process.env.HOMEPAGE_REPO || "reboot-homepage",
    maxZipBytes: Number(process.env.MAX_ZIP_BYTES || 100 * 1024 * 1024),
    maxUnzippedBytes: Number(process.env.MAX_UNZIPPED_BYTES || 250 * 1024 * 1024),
    maxZipFiles: Number(process.env.MAX_ZIP_FILES || 5000),
    preservePaths: (process.env.PRESERVE_PATHS || ".github,README.md,README,CNAME,LICENSE,.gitignore,.nojekyll")
      .split(",")
      .map((path) => path.trim())
      .filter(Boolean),
  };
}

module.exports = { getConfig };
