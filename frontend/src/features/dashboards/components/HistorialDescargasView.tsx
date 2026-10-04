import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Download, FileText, Search, SlidersHorizontal } from 'lucide-react';
import { ApiError } from '../../auth/api';
import {
  obtenerHistorialDescargas,
  EVENTO_DESCARGA,
  type RegistroDescarga,
  type ResumenDescargas,
} from '../descargasApi';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const FORMATO_TODOS = 'Todos';

// Convierte una fecha ISO en "18 ago, 2026 · 09:42" (formato de la tabla).
function formatearFecha(fecha: string): string {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return '-';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = MESES[date.getMonth()];
  const anio = date.getFullYear();
  const hora = String(date.getHours()).padStart(2, '0');
  const minuto = String(date.getMinutes()).padStart(2, '0');
  return `${dia} ${mes}, ${anio} · ${hora}:${minuto}`;
}

// Versión corta "18 ago" usada en la tarjeta de "Última descarga".
function formatearFechaCorta(fecha: string | null): string {
  if (!fecha) return '-';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return '-';
  return `${String(date.getDate()).padStart(2, '0')} ${MESES[date.getMonth()]}`;
}

function formatearTamano(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function describirError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión para ver el historial.';
  }
  if (error instanceof Error) return error.message;
  return 'No fue posible cargar el historial de descargas.';
}

export function HistorialDescargasView() {
  const [registros, setRegistros] = useState<RegistroDescarga[]>([]);
  const [resumen, setResumen] = useState<ResumenDescargas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [formato, setFormato] = useState(FORMATO_TODOS);

  useEffect(() => {
    let activo = true;

    const cargarHistorial = async () => {
      try {
        setCargando(true);
        setError(null);
        const data = await obtenerHistorialDescargas();
        if (!activo) return;
        setRegistros(data.registros ?? []);
        setResumen(data.resumen ?? null);
      } catch (err) {
        if (!activo) return;
        setRegistros([]);
        setResumen(null);
        setError(describirError(err));
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarHistorial();

    // Tras exportar desde Reportería el registro ya existe en el servidor:
    // se recarga la tabla sin esperar a que el usuario navegue de nuevo.
    window.addEventListener(EVENTO_DESCARGA, cargarHistorial);

    return () => {
      activo = false;
      window.removeEventListener(EVENTO_DESCARGA, cargarHistorial);
    };
  }, []);

  // Filtro local por nombre/periodo y por formato seleccionado.
  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return registros.filter((registro) => {
      const coincideTexto =
        texto === '' ||
        registro.nombre_archivo.toLowerCase().includes(texto) ||
        registro.periodo.toLowerCase().includes(texto);
      const coincideFormato = formato === FORMATO_TODOS || registro.formato === formato;
      return coincideTexto && coincideFormato;
    });
  }, [registros, busqueda, formato]);

  const formatosUsados = resumen?.formatosUsados ?? [];

  const descargar = (urlArchivo: string) => {
    window.open(urlArchivo, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {cargando && (
        <div
          className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm font-medium text-slate-500 animate-pulse">
            Cargando historial de descargas...
          </span>
        </div>
      )}

      {!cargando && error && (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <span className="text-sm font-medium text-red-600">{error}</span>
        </div>
      )}

      {!cargando && !error && (
        <>
          {/* TARJETAS DE MÉTRICAS SUPERIORES */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Archivos descargados</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{resumen?.totalUltimos90Dias ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">En los últimos 90 días</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Última descarga</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {formatearFechaCorta(resumen?.ultimaDescargaFecha ?? null)}
              </p>
              <p className="text-xs text-slate-400 mt-1">{resumen?.ultimaDescargaNombre ?? '-'}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Formatos utilizados</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{resumen?.formatosCantidad ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">
                {formatosUsados.length > 0 ? formatosUsados.join(' y ') : 'Ninguno'}
              </p>
            </div>
          </section>

          {/* SECCIÓN PRINCIPAL: TABLA DE ARCHIVOS */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Archivos descargados</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulta y vuelve a descargar reportes institucionales anteriores.
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 w-fit">
                <SlidersHorizontal className="size-4 text-slate-400" /> Auditoría de reportes
              </button>
            </div>

            {/* BÚSQUEDA Y FILTRO POR FORMATO */}
            <div className="p-6 pb-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Buscar por nombre de reporte o periodo..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50"
                />
              </div>
              <div className="relative w-full sm:w-36">
                <select
                  value={formato}
                  onChange={(evento) => setFormato(evento.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50"
                  aria-label="Filtrar por formato"
                >
                  <option value={FORMATO_TODOS}>{FORMATO_TODOS}</option>
                  {formatosUsados.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* TABLA DE REGISTROS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FFF9E6]">
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">ARCHIVO</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">FORMATO</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">PERIODO</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">FECHA DE DESCARGA</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200">TAMAÑO</th>
                    <th className="py-3 px-6 font-semibold text-slate-700 border-b border-slate-200 text-right">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {registrosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 px-6 text-center text-slate-500">
                        No se encontraron descargas para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    registrosFiltrados.map((registro) => (
                      <tr key={registro.id_descarga} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                              <FileText className="size-4" />
                            </div>
                            <span className="font-bold text-slate-800">{registro.nombre_archivo}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                              registro.formato === 'Excel'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}
                          >
                            {registro.formato}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600">{registro.periodo}</td>
                        <td className="py-4 px-6 text-slate-500">{formatearFecha(registro.fecha_descarga)}</td>
                        <td className="py-4 px-6 text-slate-500">{formatearTamano(registro.tamano_kb)}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => descargar(registro.url_archivo)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Download className="size-3.5 text-slate-400" /> Descargar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
