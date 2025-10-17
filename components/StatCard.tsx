import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 flex items-center space-x-4 transition-all duration-300 hover:border-primary">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-text font-medium">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-dark">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;