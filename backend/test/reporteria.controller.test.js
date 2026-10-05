import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCurricular,
  getMatricula,
  getProgresion
} from '../src/controllers/reporteria.controller.js';
import {
  FactIngreso,
  FactMatricula,
  FactProgresion,
  FactEficiencia,
  FactAvanceCurricular,
  FactAsignaturaCritica
} from '../src/persistence/models/index.js';

const createResponse = () => ({
  statusCode: null,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return body;
  }
});

const createRequest = () => ({
  params: { car_codigo: 'CAR-01' },
  academicCareer: { nombre: 'Carrera de prueba' }
});

test('getMatricula separa ingresos por cohorte de matrícula anual', async (context) => {
  let ingresoOptions;
  let matriculaOptions;

  context.mock.method(FactIngreso, 'findAll', async (options) => {
    ingresoOptions = options;
    return [{
      cohorte: '2022',
      ingresos_sua: '70',
      ingresos_pace: '10',
      ingresos_especiales: '5',
      ingresos_totales: '85',
      porcentaje_mujeres: '47.50',
      cobertura_sua: '105.20',
      cobertura_pace: null,
      cobertura_rae: '80.00',
      estados_datos: { cobertura_pace: 'NO_DISPONIBLE' }
    }];
  });
  context.mock.method(FactMatricula, 'findAll', async (options) => {
    matriculaOptions = options;
    return [{
      anio_medicion: '2024',
      matricula_total: '320',
      matricula_mujeres: '152',
      porcentaje_mujeres: '47.50',
      estados_datos: { matricula_total: 'INFORMADO' }
    }];
  });

  const response = createResponse();
  await getMatricula(createRequest(), response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(ingresoOptions.where, { car_codigo: 'CAR-01' });
  assert.deepEqual(ingresoOptions.order, [['cohorte', 'ASC']]);
  assert.deepEqual(matriculaOptions.where, { car_codigo: 'CAR-01' });
  assert.deepEqual(matriculaOptions.order, [['anio_medicion', 'ASC']]);
  assert.deepEqual(response.payload, {
    carrera: 'Carrera de prueba',
    ingresos_cohorte: [{
      cohorte: 2022,
      ingresos_sua: 70,
      ingresos_pace: 10,
      ingresos_especiales: 5,
      ingresos_totales: 85,
      porcentaje_mujeres: 47.5,
      cobertura_sua: 105.2,
      cobertura_pace: null,
      cobertura_rae: 80,
      estados_datos: { cobertura_pace: 'NO_DISPONIBLE' }
    }],
    matricula_anual: [{
      anio_medicion: 2024,
      matricula_total: 320,
      matricula_mujeres: 152,
      porcentaje_mujeres: 47.5,
      estados_datos: { matricula_total: 'INFORMADO' }
    }]
  });
  assert.equal('datos' in response.payload, false);
});

test('getProgresion expone TTT como tasa de titulación total', async (context) => {
  let receivedOptions;
  context.mock.method(FactProgresion, 'findAll', async (options) => {
    receivedOptions = options;
    return [{
      cohorte: '2019',
      retencion_a1: '91.25',
      retencion_a2: null,
      retencion_a3: '75.00',
      retencion_a4: '70.00',
      retencion_total: '82.50',
      tasa_titulacion_total: '62.10',
      tasa_titulacion_oportuna: '41.00',
      tasa_titulacion_efectiva: '30.00',
      duracion_real_semestres: '11.50',
      estados_datos: { retencion_a2: 'NO_DISPONIBLE' }
    }];
  });

  const response = createResponse();
  await getProgresion(createRequest(), response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(receivedOptions.order, [['cohorte', 'ASC']]);
  assert.equal(receivedOptions.attributes.includes('tasa_titulacion_total'), true);
  assert.equal(receivedOptions.attributes.includes('tasa_titulacion_temprana'), false);
  assert.deepEqual(response.payload.datos, [{
    cohorte: 2019,
    retencion_a1: 91.25,
    retencion_a2: null,
    retencion_a3: 75,
    retencion_a4: 70,
    retencion_total: 82.5,
    tasa_titulacion_total: 62.1,
    tasa_titulacion_oportuna: 41,
    tasa_titulacion_efectiva: 30,
    duracion_real_semestres: 11.5,
    estados_datos: { retencion_a2: 'NO_DISPONIBLE' }
  }]);
  assert.equal('tasa_titulacion_temprana' in response.payload.datos[0], false);
});

test('getCurricular usa avance curricular porcentual y el código base de asignatura', async (context) => {
  let eficienciaOptions;
  let avanceOptions;
  let criticasOptions;

  context.mock.method(FactEficiencia, 'findAll', async (options) => {
    eficienciaOptions = options;
    return [{
      cohorte: '2024',
      total_alumnos_regulares: '100',
      nivel_baja: '10',
      nivel_media: '20',
      nivel_alta: '30',
      nivel_eficiente: '40',
      estados_datos: { total_alumnos_regulares: 'INFORMADO' }
    }];
  });
  context.mock.method(FactAvanceCurricular, 'findAll', async (options) => {
    avanceOptions = options;
    return [{
      cohorte: '2024',
      porcentaje_bachillerato: '25.00',
      porcentaje_licenciatura_con_bachillerato_pendiente: '10.00',
      porcentaje_licenciatura: '30.00',
      porcentaje_titulo_con_bachillerato_licenciatura_pendiente: '5.00',
      porcentaje_titulo: '30.00',
      estados_datos: { porcentaje_titulo: 'INFORMADO' }
    }];
  });
  context.mock.method(FactAsignaturaCritica, 'findAll', async (options) => {
    criticasOptions = options;
    return [{
      asig_codigo_base: 'INFO101',
      asig_codigo: 'INFO101-24',
      semestre: '1',
      anio_medicion: '2025',
      tasa_reprobacion: '35.50',
      estado_dato: 'INFORMADO'
    }];
  });

  const response = createResponse();
  await getCurricular(createRequest(), response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(eficienciaOptions.order, [['cohorte', 'ASC']]);
  assert.deepEqual(avanceOptions.order, [['cohorte', 'ASC']]);
  assert.deepEqual(criticasOptions.order, [
    ['asig_codigo_base', 'ASC'],
    ['asig_codigo', 'ASC'],
    ['semestre', 'ASC'],
    ['anio_medicion', 'ASC']
  ]);
  assert.deepEqual(response.payload.eficiencia, [{
    cohorte: 2024,
    total_alumnos_regulares: 100,
    nivel_baja: 10,
    nivel_media: 20,
    nivel_alta: 30,
    nivel_eficiente: 40,
    estados_datos: { total_alumnos_regulares: 'INFORMADO' }
  }]);
  assert.deepEqual(response.payload.avance_curricular, [{
    cohorte: 2024,
    porcentaje_bachillerato: 25,
    porcentaje_licenciatura_con_bachillerato_pendiente: 10,
    porcentaje_licenciatura: 30,
    porcentaje_titulo_con_bachillerato_licenciatura_pendiente: 5,
    porcentaje_titulo: 30,
    estados_datos: { porcentaje_titulo: 'INFORMADO' }
  }]);
  assert.deepEqual(response.payload.criticas, [{
    asig_codigo_base: 'INFO101',
    asig_codigo: 'INFO101-24',
    semestre: 1,
    anio_medicion: 2025,
    tasa_reprobacion: 35.5,
    estado_dato: 'INFORMADO'
  }]);
  assert.equal('titulacion' in response.payload, false);
  assert.equal('titulados' in response.payload.avance_curricular[0], false);
});
