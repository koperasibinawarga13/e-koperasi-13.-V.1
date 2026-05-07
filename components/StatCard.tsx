import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBgColor }) => {
  const isNegative = value.includes('(') || value.includes('-');

  return (
    <div className="bg-slate-950/90 border border-zinc-800 p-4 rounded-3xl flex items-center space-x-3 shadow-xl shadow-black/15">
      <div className={`p-2.5 rounded-2xl text-black ${iconBgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs sm:text-sm text-gray-text font-semibold uppercase tracking-[0.08em] mb-1">{title}</p>
        <p className={`text-xl sm:text-2xl font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;