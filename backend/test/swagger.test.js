import test from 'node:test';
import assert from 'node:assert/strict';
import spec from '../src/config/swagger.js';

test('Swagger incluye las rutas documentadas tanto en Windows como en Linux', () => {
  assert.equal(spec.openapi, '3.0.0');
  for (const [path, method] of [
    ['/health', 'get'],
    ['/auth/login', 'post'],
    ['/auth/me', 'get'],
    ['/decanatura/carreras', 'get'],
    ['/reporteria/{car_codigo}/matricula', 'get'],
    ['/reporteria/{car_codigo}/progresion', 'get'],
    ['/reporteria/{car_codigo}/curricular', 'get'],
    ['/director/home', 'get']
  ]) {
    assert.ok(spec.paths[path]?.[method], `Falta ${method.toUpperCase()} ${path}`);
  }
  assert.deepEqual(
    spec.paths['/director/home'].get.parameters.map((parameter) => parameter.name),
    ['cohorte', 'anio_medicion']
  );
});
