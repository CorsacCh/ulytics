import React from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  description: string;
  positive: boolean;
  icon: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, description, positive, icon }) => {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#ffffff] p-4 transition-colors hover:border-[#FFB800]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-[#1E293B]">{label}</h4>
          <p className="mt-1 text-sm text-[#878787]">{description}</p>
        </div>
        <div className={`text-2xl ${positive? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{icon}</div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-[#878787]">Valor</p>
          <p className="mt-1 text-xl font-bold text-[#1E293B]">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
