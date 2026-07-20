

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon } from './icons/Icons';
import { getMaintenanceMode } from '../services/pengaturanService';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message?: string }>({ enabled: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await getMaintenanceMode();
        if (mounted) setMaintenance(m);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      {maintenance.enabled && (
        <div className="w-full bg-red-600 text-white text-sm py-2 px-4 text-center font-semibold">
          Aplikasi sedang dalam mode maintenance. {maintenance.message ? maintenance.message : ''}
        </div>
      )}
      <header className="py-2.5 sm:py-3 mb-4 sm:mb-5 rounded-2xl sm:rounded-3xl border border-zinc-800 bg-slate-950/90 p-3 sm:p-4 shadow-lg shadow-black/15">
      <div className="flex flex-col gap-2 sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">{title}</h1>
          <p className="text-xs sm:text-sm text-gray-text mt-1 leading-snug">Akses cepat semua informasi rekening Anda.</p>
        </div>
        <div className="flex items-center gap-2 text-white/80 self-start sm:self-center">
          {user?.photoURL ? (
              <img src={user.photoURL} alt="Profil" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-zinc-700" />
          ) : (
              <UserCircleIcon className="w-9 h-9 sm:w-10 sm:h-10 text-zinc-400" />
          )}
          <span className="font-semibold text-sm sm:text-base text-white">{user?.name}</span>
        </div>
      </div>
      </header>
    </>
  );
};

export default Header;