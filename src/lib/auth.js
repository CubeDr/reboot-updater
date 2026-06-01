const crypto = require("node:crypto");

const COOKIE_NAME = "reboot_updater_session";
const ONE_DAY_SECONDS = 24 * 60 * 60;

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createSessionCookie(secret) {
  const issuedAt = String(Date.now());
  return `${issuedAt}.${sign(issuedAt, secret)}`;
}

function isValidSessionCookie(cookieValue, secret) {
  if (!cookieValue || typeof cookieValue !== "string") return false;

  const [issuedAt, signature] = cookieValue.split(".");
  if (!issuedAt || !signature) return false;

  const ageMs = Date.now() - Number(issuedAt);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > ONE_DAY_SECONDS * 1000) {
    return false;
  }

  const expected = sign(issuedAt, secret);
  if (signature.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

module.exports = {
  COOKIE_NAME,
  ONE_DAY_SECONDS,
  createSessionCookie,
  isValidSessionCookie,
};
