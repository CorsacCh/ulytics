// Las librerías de exportación (jspdf, html2canvas, xlsx) son pesadas, por lo
// que se importan de forma diferida dentro de cada función: así no engrosan el
// bundle inicial de los dashboards y solo se cargan al pulsar "Exportar".

// Filas planas para el Excel: cada clave del objeto es un encabezado de columna.
export type FilaExportable = Record<string, unknown>;

// Un bloque seleccionable de la vista (un gráfico o una tabla).
export interface ExportModule {
  id: string; // ID del div en el DOM (ej: 'tabla-matricula')
  label: string; // Título para el selector y las secciones del reporte
  data: FilaExportable[]; // Filas planas para la hoja de Excel del bloque
  // Elementos adicionales del mismo indicador: en el PDF se capturan como
  // imágenes adicionales bajo la misma sección y en el Excel siguen siendo
  // una única hoja (útil cuando un gráfico y su tabla muestran lo mismo).
  extraIds?: string[];
  // Formatos en los que este bloque tiene sentido exportarse. Si se omite,
  // el bloque está disponible en ambos.
  formats?: ('pdf' | 'excel')[];
}

const MARGEN_MM = 10;

// Pausa mínima antes de capturar: sólo le da a React el tiempo de pintar
// el DOM y a Recharts de montar el SVG. Las animaciones se apagan con
// `isAnimationActive={!isExportMode}` en cada gráfico, así que no hace falta
// esperar a que terminen.
const ESPERA_RENDER_MS = 300;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Genera un PDF capturando, uno a uno, los elementos seleccionados. Cada bloque
 * recibe su título y, si su imagen no cabe en la página, se divide en varias
 * páginas para evitar cortes.
 */
export async function exportSelectedToPDF(
  modules: ExportModule[],
  title: string,
  filters: string,
): Promise<number> {
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas').then((modulo) => modulo.default),
  ]);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const anchoUtil = pageWidth - MARGEN_MM * 2;

  // Encabezado del reporte. Los filtros pueden incluir varias carreras y dos
  // dimensiones temporales, por lo que se dividen en líneas para no salir del A4.
  pdf.setFontSize(16);
  pdf.text(`Reporte: ${title}`, MARGEN_MM, 15);
  pdf.setFontSize(10);
  const lineasFiltros = pdf.splitTextToSize(`Filtros activos: ${filters}`, anchoUtil);
  pdf.text(lineasFiltros, MARGEN_MM, 22);
  const yFecha = 22 + lineasFiltros.length * 5;
  pdf.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, MARGEN_MM, yFecha);

  let y = yFecha + 10;

  for (const modulo of modules) {
    const ids = [modulo.id, ...(modulo.extraIds ?? [])];
    const elementos = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elementos.length === 0) continue;

    // Si no hay espacio ni para el título, empezar en una página nueva.
    if (y + 12 > pageHeight - MARGEN_MM) {
      pdf.addPage();
      y = MARGEN_MM;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(modulo.label, MARGEN_MM, y);
    y += 6;

    for (const element of elementos) {
      // Margen mínimo para que React termine de pintar este bloque.
      await esperar(ESPERA_RENDER_MS);

      const canvas = await capturarElemento(element, html2canvas);
      if (canvas.width === 0 || canvas.height === 0) continue;

    // px de canvas por mm de PDF (html2canvas usa la misma densidad en ambos ejes).
      const pxPorMm = canvas.width / anchoUtil;
      let offsetPx = 0;

      while (offsetPx < canvas.height) {
        const disponibleMm = pageHeight - MARGEN_MM - y;
        const altoSlicePx = Math.min(Math.floor(disponibleMm * pxPorMm), canvas.height - offsetPx);
        if (altoSlicePx <= 0) break;

        const recorte = recortarCanvas(canvas, offsetPx, altoSlicePx);
        const altoMm = (altoSlicePx * anchoUtil) / canvas.width;
        pdf.addImage(recorte.toDataURL('image/png'), 'PNG', MARGEN_MM, y, anchoUtil, altoMm);

        offsetPx += altoSlicePx;
        y += altoMm;

        if (offsetPx < canvas.height) {
          pdf.addPage();
          y = MARGEN_MM;
        }
      }

      y += 10; // Separación antes del siguiente bloque del mismo indicador.
    }

    y += 10; // Separación antes del siguiente indicador.
  }

  pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
  return Math.round(pdf.output('arraybuffer').byteLength / 1024);
}

/**
 * Genera un Excel con una hoja por cada bloque seleccionado.
 */
export async function exportSelectedToExcel(
  modules: ExportModule[],
  title: string,
): Promise<number> {
  const XLSX = await import('xlsx');

  const workbook = XLSX.utils.book_new();
  const nombresUsados = new Set<string>();

  modules.forEach((modulo, indice) => {
    const filas =
      modulo.data && modulo.data.length > 0 ? modulo.data : [{ Mensaje: 'Sin datos tabulares' }];
    const worksheet = XLSX.utils.json_to_sheet(filas);
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      nombreDeHoja(modulo.label, indice, nombresUsados),
    );
  });

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);

  return Math.round(dataBlob.size / 1024);
}

// Captura un bloque del DOM. html2canvas corta el contenido que vive dentro de un
// contenedor con scroll o altura fija, así que se neutralizan esos estilos
// mientras se captura y se restauran al terminar (incluso si falla).
async function capturarElemento(
  element: HTMLElement,
  html2canvas: (
    el: HTMLElement,
    opciones: Record<string, unknown>,
  ) => Promise<HTMLCanvasElement>,
): Promise<HTMLCanvasElement> {
  const estiloOriginal = element.style.cssText;
  element.style.maxHeight = 'none';
  element.style.height = 'auto';
  element.style.overflow = 'visible';

  try {
    return await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      ignoreElements: (el: Element) => el.classList.contains('no-export'),
    });
  } finally {
    element.style.cssText = estiloOriginal;
  }
}

// Recorta una franja vertical del canvas capturado para repartirla en el PDF.
function recortarCanvas(canvas: HTMLCanvasElement, offsetY: number, alto: number): HTMLCanvasElement {
  const recorte = document.createElement('canvas');
  recorte.width = canvas.width;
  recorte.height = alto;
  const contexto = recorte.getContext('2d');
  if (contexto) {
    contexto.drawImage(canvas, 0, offsetY, canvas.width, alto, 0, 0, canvas.width, alto);
  }
  return recorte;
}

// Excel limita el nombre de hoja a 31 caracteres, prohíbe ciertos símbolos y no
// admite duplicados; este helper garantiza un nombre válido y único.
function nombreDeHoja(label: string, indice: number, usados: Set<string>): string {
  let base = label.substring(0, 31).replace(/[/*?:[\]]/g, '').trim();
  if (!base) base = `Hoja${indice + 1}`;

  let nombre = base;
  let sufijo = 2;
  while (usados.has(nombre.toLowerCase())) {
    const marca = `_${sufijo}`;
    nombre = `${base.substring(0, 31 - marca.length)}${marca}`;
    sufijo += 1;
  }
  usados.add(nombre.toLowerCase());
  return nombre;
}
