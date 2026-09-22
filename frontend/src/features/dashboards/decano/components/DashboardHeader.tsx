import React from 'react';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#878787]">{subtitle}</p>
        <h1 className="mt-1 text-3xl font-bold text-[#003366]">{title}</h1>
      </div>
    </div>
  );
};

export default DashboardHeader;
