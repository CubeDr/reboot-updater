import { NextResponse } from "next/server";

import auth from "../../../lib/auth";
import configModule from "../../../lib/config";
import github from "../../../lib/github";

const { COOKIE_NAME, isValidSessionCookie } = auth;
const { getConfig } = configModule;
const { promotePreviewToHomepage } = github;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWithError(request, message) {
  return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, request.url));
}

export async function POST(request) {
  const config = getConfig();
  const session = request.cookies.get(COOKIE_NAME)?.value;

  if (!isValidSessionCookie(session, config.sessionSecret)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    await promotePreviewToHomepage({
      token: config.githubToken,
      owner: config.githubOwner,
      previewRepo: config.updaterRepo,
      previewBranch: config.previewBranch,
      homepageRepo: config.homepageRepo,
      preservePaths: config.preservePaths,
      previewOnlyPaths: ["CNAME", ".nojekyll"],
    });

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    return redirectWithError(request, error.message);
  }
}
