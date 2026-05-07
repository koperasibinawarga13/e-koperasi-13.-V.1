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
    <div className="bg-slate-950/90 border border-zinc-800 p-5 sm:p-6 rounded-3xl flex items-center space-x-4 shadow-2xl shadow-black/20">
      <div className={`p-3 rounded-2xl text-black ${iconBgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-text font-semibold uppercase tracking-[0.08em] mb-1">{title}</p>
        <p className={`text-2xl sm:text-3xl font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;