import test from "node:test";
import assert from "node:assert/strict";
import { getFacultyCareers } from "../src/controllers/decanatura.controller.js";
import { authorizeCareerScope } from "../src/middlewares/academic-scope.middleware.js";
import { Carrera } from "../src/persistence/models/index.js";

const decanoRequest = (facultyCode = "FAC-ING") => ({
  auth: {
    publicUser: {
      rol: { codigo: "DECANO" },
      ambito: {
        tipo: "FACULTAD",
        codigo: facultyCode,
        nombre: "Facultad de ejemplo"
      }
    }
  }
});

test("el endpoint lista carreras usando la facultad de la sesión", async (context) => {
  let receivedOptions;
  const careers = [{ car_codigo: "CAR-01", nombre: "Carrera de ejemplo" }];
  context.mock.method(Carrera, "findAll", async (options) => {
    receivedOptions = options;
    return careers;
  });

  let payload;
  const response = {
    json(body) {
      payload = body;
      return body;
    }
  };
  let nextError;

  await getFacultyCareers(
    decanoRequest(),
    response,
    (error) => { nextError = error; }
  );

  assert.equal(nextError, undefined);
  assert.deepEqual(receivedOptions.where, { id_macrounidad: "FAC-ING" });
  assert.deepEqual(payload.facultad, {
    codigo: "FAC-ING",
    nombre: "Facultad de ejemplo"
  });
  assert.equal(payload.carreras, careers);
});

test("la reportería rechaza una carrera perteneciente a otra facultad", async (context) => {
  context.mock.method(Carrera, "findByPk", async () => ({
    car_codigo: "CAR-01",
    id_macrounidad: "FAC-ING"
  }));

  const request = {
    ...decanoRequest("FAC-MED"),
    params: { car_codigo: "CAR-01" }
  };
  let nextError;

  await authorizeCareerScope(request, {}, (error) => {
    nextError = error;
  });

  assert.equal(nextError?.statusCode, 403);
  assert.equal(nextError?.code, "ACADEMIC_SCOPE_FORBIDDEN");
  assert.equal(request.academicCareer, undefined);
});

test("la reportería deja disponible una carrera de la facultad autorizada", async (context) => {
  const career = {
    car_codigo: "CAR-01",
    id_macrounidad: "FAC-ING"
  };
  context.mock.method(Carrera, "findByPk", async () => career);

  const request = {
    ...decanoRequest(),
    params: { car_codigo: "CAR-01" }
  };
  let nextError;

  await authorizeCareerScope(request, {}, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(request.academicCareer, career);
});
