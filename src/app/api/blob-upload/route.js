import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import auth from "../../../lib/auth";
import configModule from "../../../lib/config";

const { COOKIE_NAME, isValidSessionCookie } = auth;
const { getConfig } = configModule;

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

  try {
    const body = await request.json();
    const jsonResponse = await handleUpload({
      body,
      request,
      token: config.blobReadWriteToken,
      onBeforeGenerateToken: async () => ({
        maximumSizeInBytes: config.maxZipBytes,
        addRandomSuffix: true,
      }),
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
