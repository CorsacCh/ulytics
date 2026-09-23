import { Users, TrendingUp, GraduationCap, BarChart3 } from 'lucide-react';

export const institutionalMetrics = [
  { label: 'Matrícula Total', value: '4,820', trend: '+2.9% vs 2025', positive: true, icon: Users },
  { label: 'Retención Institucional', value: '86%', trend: '+1.2% vs 2025', positive: true, icon: TrendingUp },
  { label: 'Titulación Oportuna', value: '78%', trend: '-2.1% vs 2025', positive: false, icon: GraduationCap },
  { label: 'Carreras Monitoreadas', value: '24', trend: 'Sistema activo', positive: true, icon: BarChart3 },
];