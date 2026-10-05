import { useState } from 'react';

import { DashboardLayout } from '../../../shared/layout/DashboardLayout';
import type { Section } from '../../../shared/components/Sidebar';

import { HomeDecano } from './components/HomeDecano';
import { ProgresionAnaliticaDecano } from './components/ProgresionAnaliticaDecano';
import { ProgresionCurricularDecano } from './components/ProgresionCurricularDecano';
import { ReporteriaDecano } from './components/ReporteriaDecano';

export default function Dashboard() {
  const [section, setSection] = useState<Section>('Home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (section) {
      case 'Progresión analítica':
        return <ProgresionAnaliticaDecano />;
      case 'Progresión curricular':
        return <ProgresionCurricularDecano />;
      case 'Reportería':
        return <ReporteriaDecano />;
      case 'Home':
      default:
        return <HomeDecano />;
        }
      };

  return (
    <DashboardLayout
      section={section}
      open={sidebarOpen}
      onToggle={() => setSidebarOpen((prev) => !prev)}
      onNavigate={(sec) => setSection(sec)}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
