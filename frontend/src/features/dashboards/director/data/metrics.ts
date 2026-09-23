import { Users, TrendingUp, BookOpen, Clock } from 'lucide-react';

export const keyMetrics = [
  { 
    label: 'Matrícula nueva y especial', 
    value: '58 alumnos', 
    trend: 'Incluye ingresos PACE y RAE', 
    positive: true,
    icon: Users 
  },
  { 
    label: 'Retención de 1er año', 
    value: '95%', 
    trend: '↑ Alza vs cohorte anterior', 
    positive: true,
    icon: TrendingUp 
  },
  { 
    label: 'Titulación oportuna', 
    value: '37%', 
    trend: 'Tiempo efectivo +1 · Indicador de egreso', 
    positive: true,
    icon: BookOpen 
  },
  { 
    label: 'Tiempo promedio', 
    value: '10.0 semestres', 
    trend: 'Tiempo de titulación', 
    positive: true,
    icon: Clock 
  },
];