export const retentionData = [
  { name: 'Carrera Anónima 1', value: 98, isCurrent: false },
  { name: 'Tu Carrera (Ing. Informática)', value: 95, isCurrent: true },
  { name: 'Carrera Anónima 2', value: 91, isCurrent: false },
  { name: 'Carrera Anónima 3', value: 88, isCurrent: false },
];

export interface CohorteRetencion {
  cohorte: string;
  retencion1erAno: number | null;
  retencion2doAno: number | null;
  retencion3erAno: number | null;
}

export const evolucionRetencionData: CohorteRetencion[] = [
  { cohorte: '2019', retencion1erAno: 85, retencion2doAno: 75, retencion3erAno: 65 },
  { cohorte: '2020', retencion1erAno: 82, retencion2doAno: 72, retencion3erAno: 62 },
  { cohorte: '2021', retencion1erAno: 88, retencion2doAno: 78, retencion3erAno: 68 },
  { cohorte: '2022', retencion1erAno: 86, retencion2doAno: 79, retencion3erAno: null },
  { cohorte: '2023', retencion1erAno: 89, retencion2doAno: null, retencion3erAno: null },
];