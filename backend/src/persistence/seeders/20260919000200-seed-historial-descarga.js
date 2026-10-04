'use strict';

/**
 * Datos de ejemplo para el historial de descargas. Permiten que la sección
 * "Historial de descargas" muestre información mientras se implementa el
 * registro real de exportaciones desde los dashboards.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [fila] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS total FROM "Historial_Descarga"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Seeder idempotente: solo puebla la tabla cuando está vacía.
    if (fila.total > 0) return;

    const ahora = new Date();
    const diasAtras = (dias, hora, minuto) => {
      const fecha = new Date(ahora);
      fecha.setDate(fecha.getDate() - dias);
      fecha.setHours(hora, minuto, 0, 0);
      return fecha;
    };

    await queryInterface.bulkInsert('Historial_Descarga', [
      {
        nombre_archivo: 'Datos de Progresión Analítica',
        formato: 'Excel',
        periodo: 'Cohortes 2021–2026',
        fecha_descarga: diasAtras(1, 9, 42),
        tamano_kb: 24,
        url_archivo: '/reportes/progresion-analitica-2021-2026.xlsx'
      },
      {
        nombre_archivo: 'Datos de Progresión Curricular',
        formato: 'PDF',
        periodo: 'Cohortes 2021–2025',
        fecha_descarga: diasAtras(2, 16, 18),
        tamano_kb: 188,
        url_archivo: '/reportes/progresion-curricular-2021-2025.pdf'
      },
      {
        nombre_archivo: 'Datos de Progresión Analítica',
        formato: 'PDF',
        periodo: 'Cohortes 2017–2026',
        fecha_descarga: diasAtras(7, 11, 6),
        tamano_kb: 214,
        url_archivo: '/reportes/progresion-analitica-2017-2026.pdf'
      },
      {
        nombre_archivo: 'Datos de Progresión Curricular',
        formato: 'Excel',
        periodo: 'Cohortes 2021–2025',
        fecha_descarga: diasAtras(15, 14, 31),
        tamano_kb: 21,
        url_archivo: '/reportes/progresion-curricular-2021-2025.xlsx'
      },
      {
        nombre_archivo: 'Datos de Progresión Analítica',
        formato: 'Excel',
        periodo: 'Cohortes 2017–2026',
        fecha_descarga: diasAtras(22, 10, 12),
        tamano_kb: 25,
        url_archivo: '/reportes/progresion-analitica-2017-2026.xlsx'
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Historial_Descarga', null, {});
  }
};
