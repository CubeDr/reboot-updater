import { NextResponse } from "next/server";

import auth from "../../../lib/auth";
import configModule from "../../../lib/config";
import github from "../../../lib/github";

const { COOKIE_NAME, isValidSessionCookie } = auth;
const { getConfig } = configModule;
const { restoreMainToCommit } = github;

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
    const formData = await request.formData();
    const result = await restoreMainToCommit({
      token: config.githubToken,
      owner: config.githubOwner,
      repo: config.homepageRepo,
      targetSha: String(formData.get("sha") || ""),
    });

    const url = new URL("/", request.url);
    url.searchParams.set("success", "restore");
    url.searchParams.set("commit", result.url);
    return NextResponse.redirect(url);
  } catch (error) {
    return redirectWithError(request, error.message);
  }
}
