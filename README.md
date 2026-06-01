# reboot-updater

Vercel-hosted admin portal for publishing [`CubeDr/reboot-homepage`](https://github.com/CubeDr/reboot-homepage), which is served by GitHub Pages.

## Flow

1. `reboot-updater` runs on Vercel as a Next.js app.
2. An admin logs in with `ADMIN_PASSWORD`.
3. The admin uploads a homepage `.zip`.
4. The app validates the zip, expands it in a Vercel Function, preserves repository metadata, and creates a new commit directly on `CubeDr/reboot-homepage/main`.
5. GitHub Pages sees the `main` update and publishes the static homepage.
6. If a published update is wrong, the admin can restore a recent `main` commit from the updater UI.

## Local Setup

```sh
cp .env.example .env
npm install
npm run dev
```

Required environment variables:

- `ADMIN_PASSWORD`: password for the admin UI
- `SESSION_SECRET`: long random string used to sign the login cookie
- `GITHUB_TOKEN`: fine-grained PAT with contents read/write access to `CubeDr/reboot-homepage`
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob read/write token for large zip uploads

Optional variables are documented in `.env.example`.

By default, preserved paths are `.github`, `README.md`, `README`, `CNAME`, `LICENSE`, `.gitignore`, and `.nojekyll`.

## Vercel Setup

Create a Vercel project for this repository, attach a Vercel Blob store, and add the same environment variables in Vercel Project Settings.

The app uses Vercel Blob client uploads so large zip files do not pass through a Vercel Function request body. The default `MAX_ZIP_BYTES` is `104857600` (100 MB).

## GitHub Pages Setup

In `CubeDr/reboot-homepage`, configure GitHub Pages to publish from:

```text
Branch: main
Folder: /
```

No updater-specific GitHub Action is required. The updater creates normal commits on `main`.

## Zip Validation

The app rejects zips that:

- exceed configured upload or extracted-size limits
- contain too many files
- do not contain `index.html` at the site root after optional single-root-folder stripping
- contain `.git` or `.github`
- contain absolute paths, path traversal, backslashes, or unsupported path characters

## Restore Behavior

The restore button does not rewrite git history. It reads the selected past commit's file tree, creates a new commit on top of the current `main`, and points `main` at that new commit. This makes rollback auditable and lets GitHub Pages see a normal new commit.
