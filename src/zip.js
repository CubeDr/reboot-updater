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

function validateZip(buffer, limits) {
  return new Promise((resolve, reject) => {
    let fileCount = 0;
    let totalBytes = 0;
    let hasIndex = false;
    const topLevelNames = new Set();

    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (openError, zipfile) => {
      if (openError) {
        reject(new Error(`Could not read zip: ${openError.message}`));
        return;
      }

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        try {
          const isDirectory = entry.fileName.endsWith("/");
          const cleanName = isDirectory ? entry.fileName.slice(0, -1) : entry.fileName;

          if (cleanName) {
            validateEntryName(cleanName);
            topLevelNames.add(cleanName.split("/")[0]);
          }

          if (!isDirectory) {
            fileCount += 1;
            totalBytes += entry.uncompressedSize;
            if (cleanName === "index.html" || cleanName.endsWith("/index.html")) {
              hasIndex = true;
            }
          }

          if (fileCount > limits.maxZipFiles) {
            throw new Error(`Too many files in zip. Limit: ${limits.maxZipFiles}`);
          }
          if (totalBytes > limits.maxUnzippedBytes) {
            throw new Error(`Unzipped content is too large. Limit: ${limits.maxUnzippedBytes} bytes`);
          }
        } catch (validationError) {
          zipfile.close();
          reject(validationError);
          return;
        }

        zipfile.readEntry();
      });

      zipfile.on("end", () => {
        if (!hasIndex) {
          reject(new Error("Zip must contain an index.html file."));
          return;
        }

        resolve({ fileCount, totalBytes, topLevelNames: Array.from(topLevelNames).sort() });
      });

      zipfile.on("error", reject);
    });
  });
}

module.exports = { validateZip };
