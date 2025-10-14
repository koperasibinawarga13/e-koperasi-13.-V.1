import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  // FIX: Changed JSX.Element to React.ReactNode to resolve namespace error.
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-6 hover:shadow-lg transition-shadow duration-300">
      <div className={`p-4 rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-dark">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
