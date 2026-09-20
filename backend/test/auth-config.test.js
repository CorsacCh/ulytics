import test from "node:test";
import assert from "node:assert/strict";
import {
  getSessionCookieOptions,
  parseDurationToMs,
  useSecureSessionCookie
} from "../src/config/auth.js";

function restoreEnvironmentVariable(name, previousValue) {
  if (previousValue === undefined) delete process.env[name];
  else process.env[name] = previousValue;
}

test("convierte la duración configurada a milisegundos", () => {
  assert.equal(parseDurationToMs("30m"), 1_800_000);
  assert.equal(parseDurationToMs("8h"), 28_800_000);
  assert.equal(parseDurationToMs("1d"), 86_400_000);
  assert.throws(() => parseDurationToMs("8 horas"));
});

test("configura una cookie de sesión inaccesible para JavaScript", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousExpiration = process.env.JWT_EXPIRES_IN;
  const previousCookieSecure = process.env.COOKIE_SECURE;
  process.env.NODE_ENV = "test";
  process.env.JWT_EXPIRES_IN = "8h";
  process.env.COOKIE_SECURE = "false";

  const options = getSessionCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.secure, false);
  assert.equal(options.maxAge, 28_800_000);

  process.env.COOKIE_SECURE = "true";
  assert.equal(useSecureSessionCookie(), true);

  process.env.COOKIE_SECURE = "valor-invalido";
  assert.throws(() => useSecureSessionCookie());

  restoreEnvironmentVariable("NODE_ENV", previousNodeEnv);
  restoreEnvironmentVariable("JWT_EXPIRES_IN", previousExpiration);
  restoreEnvironmentVariable("COOKIE_SECURE", previousCookieSecure);
});
