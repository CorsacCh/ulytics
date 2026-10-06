import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite, series, asignaturas, catalogo, reportes, GraficoSeries, DataCardView;
before(async () => {
  vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
    server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
  series = await vite.ssrLoadModule('/src/features/dashboards/components/series.ts');
  asignaturas = await vite.ssrLoadModule('/src/features/dashboards/decano/asignaturas.ts');
  catalogo = await vite.ssrLoadModule('/src/features/dashboards/decano/indicadores.ts');
  reportes = await vite.ssrLoadModule('/src/features/dashboards/components/reportPresentation.ts');
  ({ GraficoSeries } = await vite.ssrLoadModule('/src/features/dashboards/components/GraficoSeries.tsx'));
  ({ DataCardView } = await vite.ssrLoadModule('/src/features/dashboards/components/DataCardView.tsx'));
});
after(async () => { await vite?.close(); });

test('Rangos inclusivos e independientes para cohortes y medición', () => {
  assert.equal(series.enRango(2022, [2022, 2024]), true);
  assert.equal(series.enRango(2024, [2022, 2024]), true);
  assert.equal(series.enRango(2025, [2022, 2024]), false);
  assert.equal(series.enRango(2025, [2025, 'todos']), true);
  assert.equal(series.enRango(2021, ['todos', 'todos']), true);
});
test('Las líneas ordenan años, insertan huecos y preservan cero y null sin mutar', () => {
  const filas = [{ periodo: 2024, valores: { cantidad: 0, tasa: null } }, { periodo: 2022, valores: { cantidad: 7, tasa: 0.5 } }];
  const copia = structuredClone(filas);
  assert.deepEqual(series.prepararSeries(filas, [{ llave: 'cantidad' }, { llave: 'tasa' }]), [
    { periodo: 2022, cantidad: 7, tasa: 0.5 }, { periodo: 2023, cantidad: null, tasa: null }, { periodo: 2024, cantidad: 0, tasa: null },
  ]);
  assert.deepEqual(filas, copia);
  assert.deepEqual(series.prepararSeries([], []), []);
});
test('Un solo período permanece visible y no se inventa una tendencia', () => {
  assert.deepEqual(series.prepararSeries([{ periodo: 2022, valores: { tasa: 0 } }], [{ llave: 'tasa' }]), [{ periodo: 2022, tasa: 0 }]);
});
test('Formato común no confunde 0, null ni porcentajes pequeños', () => {
  assert.equal(series.formatearDato(0, 'porcentaje'), '0%');
  assert.equal(series.formatearDato(0.5, 'porcentaje'), '0,5%');
  assert.equal(series.formatearDato(45.25, 'porcentaje'), '45,25%');
  assert.equal(series.formatearDato(11.25, 'decimal'), '11,25');
  assert.equal(series.formatearDato(null), 'Sin datos');
});
test('Asignaturas distintas por código completo o semestre no se fusionan', () => {
  const base = { asig_codigo: 'TEST101-1', asig_codigo_base: 'TEST101', semestre: 1, anio_medicion: 2024, tasa_reprobacion: 0 };
  const grupos = asignaturas.agruparAsignaturas([base, { ...base, asig_codigo: 'TEST101-2', tasa_reprobacion: null }, { ...base, semestre: 2, tasa_reprobacion: 25 }]);
  assert.equal(grupos.length, 3);
  assert.deepEqual(asignaturas.serieAsignatura(grupos[0], [2024, 2025]), [
    { periodo: 2024, valores: { tasa_reprobacion: 0 } }, { periodo: 2025, valores: { tasa_reprobacion: null } },
  ]);
});
test('Gráficos del reporte leen exactamente las mismas filas que las tablas', () => {
  const filas = [{ Cohorte: 2024, SUA: 15, PACE: 0, Especial: null, Total: 20 }];
  assert.deepEqual(catalogo.seriesDesdeTabla(filas, ['Cohorte', 'SUA', 'PACE', 'Especial', 'Total'], catalogo.INDICADORES_INGRESOS), [
    { periodo: 2024, valores: { ingresos_sua: 15, ingresos_pace: 0, ingresos_especiales: null, ingresos_totales: 20 } },
  ]);
  assert.throws(() => catalogo.seriesDesdeTabla(filas, ['Cohorte'], catalogo.INDICADORES_INGRESOS));
});

function modulo() {
  return { id: 'retencion', label: 'Retención', data: [], render: () => 'original',
    seccionesPdf: ['CAR-A', 'CAR-B'].map((id) => ({ id, label: id, grafico: () => `Gráfico ${id}`, tabla: () => `Tabla ${id}` })) };
}
test('PDF tabla/gráfico/ambos conserva carreras separadas y orden gráfico-tabla', () => {
  assert.deepEqual(reportes.prepararModulosPDF([modulo()], {}).map((m) => m.id), ['CAR-A-tabla', 'CAR-B-tabla']);
  assert.deepEqual(reportes.prepararModulosPDF([modulo()], { retencion: 'grafico' }).map((m) => m.render()), ['Gráfico CAR-A', 'Gráfico CAR-B']);
  assert.deepEqual(reportes.prepararModulosPDF([modulo()], { retencion: 'ambos' }).map((m) => m.render()), ['Gráfico CAR-A', 'Tabla CAR-A', 'Gráfico CAR-B', 'Tabla CAR-B']);
});
test('Reportería antigua del director conserva módulos y extraIds', () => {
  const antiguo = { id: 'director', label: 'Director', data: [], extraIds: ['segunda-tabla'], render: () => 'contenido' };
  assert.equal(reportes.prepararModulosPDF([antiguo], {})[0], antiguo);
});
test('El gráfico separa porcentajes y semestres y declara ausencia de datos', () => {
  const html = renderToStaticMarkup(createElement(GraficoSeries, { filas: [], indicadores: catalogo.INDICADORES_TITULACION }));
  assert.match(html, /Porcentaje/);
  assert.match(html, /Semestres/);
  assert.equal((html.match(/Sin datos para la selección actual/g) ?? []).length, 2);
});
test('Selector compartido tiene botones accesibles y conserva la vista inicial', () => {
  const html = renderToStaticMarkup(createElement(DataCardView, { title: 'Prueba', defaultView: 'table', chartComponent: 'CONTENIDO GRAFICO', tableComponent: 'CONTENIDO TABLA' }));
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /CONTENIDO TABLA/);
  assert.doesNotMatch(html, /CONTENIDO GRAFICO/);
});
