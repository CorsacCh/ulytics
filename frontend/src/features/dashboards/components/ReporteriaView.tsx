import { useState, type ReactNode } from 'react';
import { apiRequest } from '../../auth/api';
import {
  exportSelectedToPDF,
  exportSelectedToExcel,
  type ExportModule,
} from '../../../utils/exportUtils';
import { HistorialDescargasView } from './HistorialDescargasView';

// Evento que dispara la recarga del historial tras registrar una descarga.
export const EVENTO_DESCARGA = 'download-registered';

// Bloque exportable: sus datos alimentan el Excel y `render` produce el nodo
// que html2canvas captura para el PDF.
export interface ModuloReporteria extends ExportModule {
  categoria: string;
  render: () => ReactNode;
  // Distintivo visual en el selector: separa el bloque gráfico (solo PDF)
  // del tabular (PDF + Excel) sin recargar el nombre del módulo.
  tipoVista?: 'Gráfico' | 'Tabla' | 'Mixto';
}

interface ReporteriaViewProps {
  modulos: ModuloReporteria[];
  reportTitle: string;
  activeFilters: string;
  etiqueta: string;
  subtitulo: string;
  descripcionHistorial: string;
  configuracion?: ReactNode;
  formatosDisponibles?: FormatoExportable[];
  etiquetaBotonPdf?: string;
  loading?: boolean;
  error?: string | null;
}

type FormatoExportable = NonNullable<ExportModule['formats']>[number];

// Un bloque sin `formats` declarado está disponible en todos los formatos.
function admiteFormato(modulo: ModuloReporteria, formato: FormatoExportable): boolean {
  return !modulo.formats || modulo.formats.includes(formato);
}

export function ReporteriaView({
  modulos,
  reportTitle,
  activeFilters,
  etiqueta,
  subtitulo,
  descripcionHistorial,
  configuracion,
  formatosDisponibles = ['pdf', 'excel'],
  etiquetaBotonPdf = 'Exportar a PDF',
  loading = false,
  error = null,
}: ReporteriaViewProps) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [exportando, setExportando] = useState<FormatoExportable | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const cantidadSeleccionadosDisponibles = modulos.filter((modulo) =>
    seleccionados.includes(modulo.id),
  ).length;
  const todosSeleccionados =
    modulos.length > 0 && cantidadSeleccionadosDisponibles === modulos.length;
  const categorias = [...new Set(modulos.map((modulo) => modulo.categoria))];

  const alternar = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const alternarTodos = () => {
    setSeleccionados(todosSeleccionados ? [] : modulos.map((modulo) => modulo.id));
  };
const registrarDescarga = async (formato: string, tamanoKb: number) => {
    try {
      await apiRequest('/api/descargas', {
        method: 'POST',
        body: JSON.stringify({
          nombre_archivo: reportTitle,
          formato,
          periodo: activeFilters,
          tamano_kb: tamanoKb,
          url_archivo: 'Generado localmente',
        }),
      });
      // El historial ya se montó en esta vista: se le avisa para que se refresque.
      window.dispatchEvent(new Event(EVENTO_DESCARGA));
    } catch (err) {
      // El archivo ya se descargó; solo falló el registro en el historial.
      console.error('No se pudo registrar la descarga en el historial', err);
    }
  };

  const manejarExportar = async (formato: FormatoExportable) => {
    if (seleccionados.length === 0) {
      setMensajeError('Selecciona al menos un indicador para exportar.');
      return;
    }

    // Los bloques que no admiten el formato elegido se omiten en lugar de fallar.
    const activos = modulos.filter(
      (modulo) => seleccionados.includes(modulo.id) && admiteFormato(modulo, formato),
    );

    if (activos.length === 0) {
      setMensajeError(`Ningún indicador seleccionado está disponible en ${formato.toUpperCase()}.`);
      return;
    }

    setExportando(formato);
    setMensajeError(null);

    try {
      const tamanoKb =
        formato === 'pdf'
          ? await exportSelectedToPDF(activos, reportTitle, activeFilters)
          : await exportSelectedToExcel(activos, reportTitle);

      await registrarDescarga(formato.toUpperCase(), tamanoKb);
      setSeleccionados([]);
    } catch (err) {
      console.error(err);
      setMensajeError(`No se pudo generar el archivo ${formato.toUpperCase()}.`);
    } finally {
      setExportando(null);
    }
  };
  const botonesDeshabilitados =
    exportando !== null || cantidadSeleccionadosDisponibles === 0 || loading || Boolean(error);

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 bg-[#F8FAFC] p-5 sm:p-8 lg:p-10">
      <header>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">{etiqueta}</p>
        <h1 className="text-3xl font-bold text-[#0A192F]">{reportTitle}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitulo}</p>
      </header>

      {/* ZONA 1: configuración del reporte */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {configuracion && (
          <div className="mb-8 border-b border-slate-200 pb-8">{configuracion}</div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Selecciona el contenido</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#004d99] hover:text-[#003366]">
            <input
              type="checkbox"
              checked={todosSeleccionados}
              onChange={alternarTodos}
              disabled={modulos.length === 0}
            />
            Seleccionar todo
          </label>
        </div>

        {loading && (
          <div className="flex min-h-[120px] items-center justify-center rounded-lg bg-slate-50">
            <span className="animate-pulse text-sm font-medium text-slate-500">
              Cargando indicadores disponibles...
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-red-100 bg-red-50">
            <span className="text-sm font-medium text-red-600">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-8 sm:grid-cols-2">
            {categorias.map((categoria) => (
              <div key={categoria}>
                <h3 className="mb-4 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {categoria}
                </h3>
                <div className="flex flex-col gap-3">
                  {modulos
                    .filter((modulo) => modulo.categoria === categoria)
                    .map((modulo) => (
                      <label
                        key={modulo.id}
                        className="-ml-2 flex cursor-pointer items-center justify-between gap-3 rounded p-2 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={seleccionados.includes(modulo.id)}
                            onChange={() => alternar(modulo.id)}
                          />
                          <span className="font-medium text-slate-700">{modulo.label}</span>
                        </div>
                        {/* BADGE UX: identifica de un vistazo el tipo de vista */}
                        {modulo.tipoVista && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              modulo.tipoVista === 'Gráfico'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {modulo.tipoVista}
                          </span>
                        )}
                      </label>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {mensajeError && <p className="mt-4 text-sm font-medium text-red-600">{mensajeError}</p>}

        <div className="mt-8 flex flex-wrap gap-4 border-t border-slate-100 pt-6">
          {formatosDisponibles.includes('pdf') && (
            <button
              type="button"
              onClick={() => manejarExportar('pdf')}
              disabled={botonesDeshabilitados}
              className="rounded-lg bg-[#004d99] px-6 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-[#003366] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportando === 'pdf' ? 'Generando PDF...' : etiquetaBotonPdf}
            </button>
          )}
          {formatosDisponibles.includes('excel') && (
            <button
              type="button"
              onClick={() => manejarExportar('excel')}
              disabled={botonesDeshabilitados}
              className="rounded-lg bg-[#2D7C5E] px-6 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-[#236349] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportando === 'excel' ? 'Generando Excel...' : 'Exportar a Excel'}
            </button>
          )}
        </div>
      </section>

      {/*
        ZONA OCULTA: motor de render para html2canvas.

        Sin `opacity`, `display:none` ni `pointer-events-none`: Recharts mide su
        contenedor con ResizeObserver, y si el ancestro está colapsado o
        translúcido el SVG sale en blanco en el PDF. La separación del viewport
        (left-[-10000px]) y el z-index negativo bastan para que el usuario no
        la vea. Cada bloque recibe un alto fijo porque el <ResponsiveContainer>
        de los gráficos necesita dimensiones reales para renderizar.
      */}
      <div aria-hidden="true" className="absolute left-[-10000px] top-0 z-[-1] w-[1000px]">
        {modulos.map((modulo) => (
          <div key={modulo.id} id={modulo.id} className="preview-module">
            <div style={{ width: '100%', minHeight: '450px' }}>{modulo.render()}</div>
          </div>
        ))}
      </div>

      {/* ZONA 2: historial de descargas */}
      <section className="border-t border-slate-200 pt-8">
        <h2 className="mb-1 text-xl font-bold text-[#0A192F]">Historial de reportes generados</h2>
        <p className="mb-6 text-sm text-slate-500">{descripcionHistorial}</p>
        <HistorialDescargasView />
      </section>
    </div>
  );
}
