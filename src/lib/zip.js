const path = require("node:path");
const yauzl = require("yauzl");

const ALLOWED_ENTRY_PATTERN = /^[\w .,@()+=[\]{}~!#$%^&';-]+$/;
const BLOCKED_NAMES = new Set([".git", ".github"]);

function validateEntryName(entryName) {
  if (!entryName || entryName.startsWith("/") || entryName.startsWith("\\")) {
    throw new Error(`Invalid zip path: ${entryName}`);
  }

  if (entryName.includes("\\")) {
    throw new Error(`Backslashes are not allowed in zip paths: ${entryName}`);
  }

  const normalized = path.posix.normalize(entryName);
  if (normalized.startsWith("../") || normalized === ".." || normalized !== entryName.replace(/\/$/, "")) {
    throw new Error(`Path traversal is not allowed: ${entryName}`);
  }

  for (const part of normalized.split("/")) {
    if (!part || part === "." || part === "..") {
      throw new Error(`Invalid zip path segment: ${entryName}`);
    }
    if (BLOCKED_NAMES.has(part)) {
      throw new Error(`Zip must not contain repository metadata: ${entryName}`);
    }
    if (!ALLOWED_ENTRY_PATTERN.test(part)) {
      throw new Error(`Unsupported characters in zip path: ${entryName}`);
    }
  }
}

function stripSingleRootDirectory(files) {
  const filePaths = Array.from(files.keys());
  const hasRootIndex = filePaths.includes("index.html");
  const topLevelNames = new Set(filePaths.map((filePath) => filePath.split("/")[0]));

  if (hasRootIndex || topLevelNames.size !== 1) {
    return files;
  }

  const [rootName] = Array.from(topLevelNames);
  const stripped = new Map();

  for (const [filePath, content] of files.entries()) {
    stripped.set(filePath.slice(rootName.length + 1), content);
  }

  return stripped;
}

function readEntry(zipfile, entry) {
  return new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (streamError, stream) => {
      if (streamError) {
        reject(streamError);
        return;
      }

      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  });
}

function readHomepageZip(buffer, limits) {
  return new Promise((resolve, reject) => {
    let fileCount = 0;
    let totalBytes = 0;
    let hasIndex = false;
    const files = new Map();

    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (openError, zipfile) => {
      if (openError) {
        reject(new Error(`Could not read zip: ${openError.message}`));
        return;
      }

      zipfile.readEntry();
      zipfile.on("entry", async (entry) => {
        try {
          const isDirectory = entry.fileName.endsWith("/");
          const cleanName = isDirectory ? entry.fileName.slice(0, -1) : entry.fileName;

          if (cleanName) {
            validateEntryName(cleanName);
          }

          if (!isDirectory) {
            fileCount += 1;
            totalBytes += entry.uncompressedSize;
            if (fileCount > limits.maxZipFiles) {
              throw new Error(`Too many files in zip. Limit: ${limits.maxZipFiles}`);
            }
            if (totalBytes > limits.maxUnzippedBytes) {
              throw new Error(`Unzipped content is too large. Limit: ${limits.maxUnzippedBytes} bytes`);
            }

            files.set(cleanName, await readEntry(zipfile, entry));
          }
        } catch (validationError) {
          zipfile.close();
          reject(validationError);
          return;
        }

        zipfile.readEntry();
      });

      zipfile.on("end", () => {
        const normalizedFiles = stripSingleRootDirectory(files);
        hasIndex = normalizedFiles.has("index.html");

        if (!hasIndex) {
          reject(new Error("Zip must contain an index.html file at the site root."));
          return;
        }

        resolve({
          files: normalizedFiles,
          summary: {
            fileCount: normalizedFiles.size,
            totalBytes,
            topLevelNames: Array.from(new Set(Array.from(normalizedFiles.keys()).map((filePath) => filePath.split("/")[0]))).sort(),
          },
        });
      });

      zipfile.on("error", reject);
    });
  });
}

module.exports = { readHomepageZip };
