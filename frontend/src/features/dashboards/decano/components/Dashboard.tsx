import React from 'react';
import DashboardHeader from './DashboardHeader';
import KpiCard from './KpiCard';
import { metrics } from '../data/metrics';
import { careerData } from '../data/careerData';
import { distributionData } from '../data/distributionData';
import { criticalSubjects } from '../data/criticalSubjects';

const Dashboard = () => {
  return (
    <div className="mx-auto max-w-[1440px] space-y-8 p-5 sm:p-8 lg:p-10">
      <DashboardHeader title="Dashboard del Decano" subtitle="Ingeniería Civil Informática" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </section>
      {/* Rest of the dashboard components */}
    </div>
  );
};

export default Dashboard;
