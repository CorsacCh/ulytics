import test from "node:test";
import assert from "node:assert/strict";
import {
  isInstitutionalEmail,
  normalizeEmail,
  validatePasswordPolicy
} from "../src/utils/credentials.js";

test("normaliza un correo institucional", () => {
  assert.equal(normalizeEmail("  USUARIO@UACH.CL "), "usuario@uach.cl");
});

test("acepta exclusivamente el dominio uach.cl", () => {
  assert.equal(isInstitutionalEmail("persona@uach.cl", "uach.cl"), true);
  assert.equal(isInstitutionalEmail("persona@sub.uach.cl", "uach.cl"), false);
  assert.equal(isInstitutionalEmail("persona@gmail.com", "uach.cl"), false);
  assert.equal(isInstitutionalEmail("@uach.cl", "uach.cl"), false);
});

test("valida la política de contraseñas", () => {
  assert.equal(validatePasswordPolicy("Temporal2026Segura").valid, true);
  assert.equal(validatePasswordPolicy("corta1A").valid, false);
  assert.equal(validatePasswordPolicy("SINMINUSCULAS2026").valid, false);
  assert.equal(validatePasswordPolicy("sinmayusculas2026").valid, false);
  assert.equal(validatePasswordPolicy("SinNumerosSegura").valid, false);
});
