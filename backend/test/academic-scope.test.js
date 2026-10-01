import test from "node:test";
import assert from "node:assert/strict";
import { canAccessCareer } from "../src/utils/academic-scope.js";

const facultyCareer = {
  careerCode: "CAR-01",
  facultyCode: "FAC-ING"
};

test("un decano puede consultar una carrera de su facultad", () => {
  assert.equal(canAccessCareer({
    roleCode: "DECANO",
    scopeType: "FACULTAD",
    scopeCode: "FAC-ING",
    ...facultyCareer
  }), true);
});

test("un decano no puede consultar una carrera de otra facultad", () => {
  assert.equal(canAccessCareer({
    roleCode: "DECANO",
    scopeType: "FACULTAD",
    scopeCode: "FAC-MED",
    ...facultyCareer
  }), false);
});

test("un director solamente puede consultar su propia carrera", () => {
  assert.equal(canAccessCareer({
    roleCode: "DIRECTOR",
    scopeType: "PROGRAMA",
    scopeCode: "CAR-01",
    ...facultyCareer
  }), true);
  assert.equal(canAccessCareer({
    roleCode: "DIRECTOR",
    scopeType: "PROGRAMA",
    scopeCode: "CAR-02",
    ...facultyCareer
  }), false);
});

test("los roles institucionales requieren ámbito institucional", () => {
  assert.equal(canAccessCareer({
    roleCode: "AUTORIDAD_CENTRAL",
    scopeType: "INSTITUCION",
    scopeCode: "UACh",
    ...facultyCareer
  }), true);
  assert.equal(canAccessCareer({
    roleCode: "ADMIN",
    scopeType: "FACULTAD",
    scopeCode: "FAC-ING",
    ...facultyCareer
  }), false);
});
