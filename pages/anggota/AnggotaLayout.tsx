import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavBar from '../../components/BottomNavBar';
import { useAuth } from '../../context/AuthContext';
import { getMaintenanceMode } from '../../services/pengaturanService';

const AnggotaLayout: React.FC = () => {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message?: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await getMaintenanceMode();
        if (mounted) setMaintenance(m);
      } catch (err) {
        if (mounted) setMaintenance({ enabled: false });
      }
    })();
    return () => { mounted = false; };
  }, []);

  // While loading maintenance flag, render nothing (or a spinner)
  if (maintenance === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-gray-text">Memeriksa status aplikasi...</div>
      </div>
    );
  }

  // If maintenance enabled and user is not admin => show maintenance-only page
  if (maintenance.enabled && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-lg text-center p-8 bg-surface rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-2">Aplikasi Sedang Maintenance</h2>
          <p className="text-sm text-gray-text mb-4">{maintenance.message || 'Maaf, layanan sedang dimatikan untuk pemeliharaan. Silakan coba beberapa saat lagi.'}</p>
          
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-dark">
      <div className="relative flex-1">
        <main className="flex-1 p-3 sm:p-4 md:p-8 pb-24 sm:pb-28">
          <Outlet />
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default AnggotaLayout;