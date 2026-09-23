import { Users, AlertTriangle, GraduationCap } from 'lucide-react';

export const metrics = [
  { label: 'Matrícula Total Facultad', value: '1,850', description: 'En 7 carreras', positive: true, icon: Users },
  { label: 'Retención Promedio (1er año)', value: '88%', description: '-1% vs año anterior', positive: false, icon: AlertTriangle },
  { label: 'Titulación Oportuna Global', value: '41%', description: 'Cohortes con seguimiento N+1', positive: true, icon: GraduationCap },
  { label: 'Carreras en Riesgo', value: '2', description: 'Retención < 85%', positive: false, icon: AlertTriangle },
];