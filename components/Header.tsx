

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon } from './icons/Icons';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="py-3 mb-5 rounded-3xl border border-zinc-800 bg-slate-950/90 p-4 shadow-lg shadow-black/15">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-text mt-1">Akses cepat semua informasi rekening Anda.</p>
        </div>
        <div className="flex items-center space-x-2 text-white/80">
          {user?.photoURL ? (
              <img src={user.photoURL} alt="Profil" className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
          ) : (
              <UserCircleIcon className="w-10 h-10 text-zinc-400" />
          )}
          <span className="font-semibold text-white">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;