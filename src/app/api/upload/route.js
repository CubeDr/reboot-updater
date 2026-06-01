import { NextResponse } from "next/server";

import auth from "../../../lib/auth";
import configModule from "../../../lib/config";
import github from "../../../lib/github";
import zip from "../../../lib/zip";

const { COOKIE_NAME, isValidSessionCookie } = auth;
const { getConfig } = configModule;
const { publishHomepageFiles } = github;
const { readHomepageZip } = zip;

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
    const file = formData.get("homepageZip");

    if (!file || typeof file.arrayBuffer !== "function") {
      throw new Error("zip 파일을 선택해주세요.");
    }
    if (!file.name?.endsWith(".zip") && file.type !== "application/zip") {
      throw new Error("zip 파일만 업로드할 수 있습니다.");
    }
    if (file.size > config.maxZipBytes) {
      throw new Error(`zip 파일은 ${Math.floor(config.maxZipBytes / 1024 / 1024)} MB 이하만 업로드할 수 있습니다.`);
    }

    const zipBuffer = Buffer.from(await file.arrayBuffer());
    const { files, summary } = await readHomepageZip(zipBuffer, {
      maxZipFiles: config.maxZipFiles,
      maxUnzippedBytes: config.maxUnzippedBytes,
    });

    const result = await publishHomepageFiles({
      token: config.githubToken,
      owner: config.githubOwner,
      repo: config.homepageRepo,
      files,
      summary,
      preservePaths: config.preservePaths,
    });

    const url = new URL("/", request.url);
    url.searchParams.set("success", "upload");
    url.searchParams.set("files", String(summary.fileCount));
    url.searchParams.set("commit", result.url);
    return NextResponse.redirect(url);
  } catch (error) {
    return redirectWithError(request, error.message);
  }
}
