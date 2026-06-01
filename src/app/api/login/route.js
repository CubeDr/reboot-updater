import { NextResponse } from "next/server";

import auth from "../../../lib/auth";
import configModule from "../../../lib/config";

const { COOKIE_NAME, ONE_DAY_SECONDS, createSessionCookie } = auth;
const { getConfig } = configModule;

export const runtime = "nodejs";

export async function POST(request) {
  const config = getConfig();
  const formData = await request.formData();
  const password = formData.get("password");

  if (password !== config.adminPassword) {
    return NextResponse.redirect(new URL("/?error=비밀번호가 올바르지 않습니다.", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(COOKIE_NAME, createSessionCookie(config.sessionSecret), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_DAY_SECONDS,
    path: "/",
  });
  return response;
}
