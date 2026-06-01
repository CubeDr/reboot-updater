# reboot-updater

Admin-only upload portal for updating [`CubeDr/reboot-homepage`](https://github.com/CubeDr/reboot-homepage).

## Flow

1. An admin logs in with `ADMIN_PASSWORD`.
2. The admin uploads a homepage `.zip`.
3. The app validates the zip and commits it to the `zip` branch of `CubeDr/reboot-homepage` as `site.zip`.
4. A GitHub Action in `reboot-homepage` unzips `site.zip`, replaces the web files on `main`, preserves repository metadata, and pushes the result.
5. If a published update is wrong, the admin can restore a recent `main` commit from the updater UI.

## Setup

```sh
cp .env.example .env
npm install
npm start
```

Required environment variables:

- `ADMIN_PASSWORD`: password for the admin UI
- `SESSION_SECRET`: long random string used to sign the login cookie
- `GITHUB_TOKEN`: fine-grained PAT with contents read/write access to `CubeDr/reboot-homepage`

Optional variables are documented in `.env.example`.

## Install the homepage workflow

Copy `reboot-homepage-workflow.yml` into `CubeDr/reboot-homepage` at:

```text
.github/workflows/publish-uploaded-homepage.yml
```

Then add a repository secret in `CubeDr/reboot-homepage`:

```text
REBOOT_HOMEPAGE_PAT=github_pat_xxx
```

Use a fine-grained PAT with contents read/write access to `CubeDr/reboot-homepage`. This PAT is used instead of the default `GITHUB_TOKEN` so the push to `main` can trigger the normal GitHub Pages deployment flow.

## Zip validation

The app rejects zips that:

- exceed configured upload or extracted-size limits
- contain too many files
- do not contain `index.html`
- contain `.git` or `.github`
- contain absolute paths, path traversal, backslashes, or unsupported path characters

## Preview options

GitHub Pages has one production site per repository Pages configuration. For preview URLs, use one of these patterns:

- create a PR from a preview branch and use a third-party preview host such as Cloudflare Pages, Vercel, or Netlify
- make the updater push to `preview` first, then expose a manual approve button that copies the same zip to `zip`
- use GitHub Actions artifacts for downloadable previews, without a public URL

## Restore behavior

The restore button does not rewrite git history. It reads the selected past commit's file tree, creates a new commit on top of the current `main`, and points `main` at that new commit. This makes rollback auditable and lets GitHub Pages see a normal new commit.
