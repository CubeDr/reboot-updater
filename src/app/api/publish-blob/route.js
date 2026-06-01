import { NextResponse } from "next/server";

import auth from "../../../lib/auth";
import blob from "../../../lib/blob";
import configModule from "../../../lib/config";
import github from "../../../lib/github";
import zip from "../../../lib/zip";

const { COOKIE_NAME, isValidSessionCookie } = auth;
const { deleteBlobQuietly, readPrivateBlob } = blob;
const { getConfig } = configModule;
const { publishPreviewFiles } = github;
const { readHomepageZip } = zip;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const config = getConfig();
  const session = request.cookies.get(COOKIE_NAME)?.value;

  if (!isValidSessionCookie(session, config.sessionSecret)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (!config.blobReadWriteToken) {
    return NextResponse.json(
      { error: "Vercel Blob read/write token 환경변수가 없습니다. BLOB_READ_WRITE_TOKEN을 확인해주세요." },
      { status: 500 },
    );
  }

  let blobUrl = "";

  try {
    const body = await request.json();
    blobUrl = String(body.url || "");
    if (!blobUrl.startsWith("https://")) {
      throw new Error("Blob URL이 올바르지 않습니다.");
    }

    const zipBuffer = await readPrivateBlob(blobUrl, config.blobReadWriteToken);
    if (zipBuffer.byteLength > config.maxZipBytes) {
      throw new Error(`zip 파일은 ${Math.floor(config.maxZipBytes / 1024 / 1024)} MB 이하만 업로드할 수 있습니다.`);
    }

    const { files, summary } = await readHomepageZip(zipBuffer, {
      maxZipFiles: config.maxZipFiles,
      maxUnzippedBytes: config.maxUnzippedBytes,
    });

    const result = await publishPreviewFiles({
      token: config.githubToken,
      owner: config.githubOwner,
      repo: config.updaterRepo,
      branch: config.previewBranch,
      files,
      summary,
      previewCname: config.previewCname,
    });

    await deleteBlobQuietly(blobUrl, config.blobReadWriteToken);

    return NextResponse.json({
      commitUrl: result.url,
      fileCount: summary.fileCount,
      previewUrl: config.previewUrl,
      totalBytes: summary.totalBytes,
    });
  } catch (error) {
    if (blobUrl) {
      await deleteBlobQuietly(blobUrl, config.blobReadWriteToken);
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
