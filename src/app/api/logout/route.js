import { NextResponse } from "next/server";

import auth from "../../../lib/auth";

const { COOKIE_NAME } = auth;

export const runtime = "nodejs";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(COOKIE_NAME);
  return response;
}
