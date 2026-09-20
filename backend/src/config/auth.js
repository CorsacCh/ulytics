export const SESSION_COOKIE_NAME = "ulytics_session";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET debe contener al menos 32 caracteres.");
  }

  return secret;
}

export function getJwtExpiration() {
  return process.env.JWT_EXPIRES_IN?.trim() || "8h";
}

export function useSecureSessionCookie() {
  const configuredValue = process.env.COOKIE_SECURE?.trim().toLowerCase();

  if (!configuredValue) return process.env.NODE_ENV === "production";
  if (configuredValue === "true") return true;
  if (configuredValue === "false") return false;

  throw new Error("COOKIE_SECURE debe ser true o false.");
}

export function parseDurationToMs(value) {
  const match = /^(\d+)(m|h|d)$/.exec(value);

  if (!match) {
    throw new Error("JWT_EXPIRES_IN debe usar el formato 30m, 8h o 1d.");
  }

  const amount = Number(match[1]);
  const multipliers = { m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[match[2]];
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: useSecureSessionCookie(),
    sameSite: "lax",
    maxAge: parseDurationToMs(getJwtExpiration()),
    path: "/"
  };
}

export function getClearCookieOptions() {
  const { maxAge: _maxAge, ...options } = getSessionCookieOptions();
  return options;
}
