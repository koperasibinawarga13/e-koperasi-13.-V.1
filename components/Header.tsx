


import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon } from './icons/Icons';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="bg-surface p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold text-zinc-100">{title}</h1>
        <div className="flex items-center space-x-3 text-zinc-400">
          <UserCircleIcon className="w-8 h-8 text-gray-400" />
          <span className="font-medium">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;