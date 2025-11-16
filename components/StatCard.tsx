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
    <div className="bg-surface p-4 sm:p-6 rounded-xl flex items-center space-x-4">
      <div className={`p-3 rounded-lg text-white ${iconBgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-text font-medium">{title}</p>
        <p className={`text-xl sm:text-2xl font-bold ${isNegative ? 'text-red-500' : 'text-dark'}`}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;