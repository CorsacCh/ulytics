import test from "node:test";
import assert from "node:assert/strict";
import {
  expectedScopeType,
  isRoleScopeCompatible
} from "../src/utils/role-scope.js";

test("asigna el tipo de ámbito requerido por cada rol", () => {
  assert.equal(expectedScopeType("ADMIN"), "INSTITUCION");
  assert.equal(expectedScopeType("DIRECTOR"), "PROGRAMA");
  assert.equal(expectedScopeType("DECANO"), "FACULTAD");
  assert.equal(expectedScopeType("AUTORIDAD_CENTRAL"), "INSTITUCION");
});

test("rechaza asociaciones incompatibles entre rol y ámbito", () => {
  assert.equal(isRoleScopeCompatible("DIRECTOR", "PROGRAMA"), true);
  assert.equal(isRoleScopeCompatible("DIRECTOR", "FACULTAD"), false);
  assert.equal(isRoleScopeCompatible("DECANO", "FACULTAD"), true);
  assert.equal(isRoleScopeCompatible("DECANO", "INSTITUCION"), false);
});
