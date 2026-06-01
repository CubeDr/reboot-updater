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

  try {
    const body = await request.json();
    const jsonResponse = await handleUpload({
      body,
      request,
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
