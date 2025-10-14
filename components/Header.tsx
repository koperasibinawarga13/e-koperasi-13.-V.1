
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon } from './icons/Icons';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm p-6 rounded-lg mb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">{title}</h1>
        <div className="flex items-center space-x-3 text-gray-600">
          <UserCircleIcon className="w-8 h-8 text-gray-400" />
          <span className="font-medium">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
