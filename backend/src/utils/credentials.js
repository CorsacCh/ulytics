export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function getInstitutionalDomain() {
  const domain = process.env.INSTITUTIONAL_EMAIL_DOMAIN?.trim().toLowerCase();

  if (!domain) {
    throw new Error("INSTITUTIONAL_EMAIL_DOMAIN no está configurado.");
  }

  return domain.replace(/^@/, "");
}

export function isInstitutionalEmail(email, domain = getInstitutionalDomain()) {
  const normalizedEmail = normalizeEmail(email);
  const parts = normalizedEmail.split("@");
  return parts.length === 2 && Boolean(parts[0]) && parts[1] === domain;
}

export function validatePasswordPolicy(password) {
  const errors = [];

  if (password.length < 12) errors.push("Debe contener al menos 12 caracteres.");
  if (password.length > 128) errors.push("No puede superar 128 caracteres.");
  if (!/[a-záéíóúñ]/u.test(password)) errors.push("Debe incluir una minúscula.");
  if (!/[A-ZÁÉÍÓÚÑ]/u.test(password)) errors.push("Debe incluir una mayúscula.");
  if (!/\d/.test(password)) errors.push("Debe incluir un número.");

  return { valid: errors.length === 0, errors };
}

export function assertPasswordPolicy(password) {
  const result = validatePasswordPolicy(password);

  if (!result.valid) {
    const error = new Error(result.errors.join(" "));
    error.statusCode = 422;
    error.code = "PASSWORD_POLICY_ERROR";
    throw error;
  }
}
