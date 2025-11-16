


import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
// FIX: Changed import to be a named import to fix module resolution error.
import { LoginPage } from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnggota from './pages/admin/AdminAnggota';
import AdminUpload from './pages/admin/AdminUpload';
import AdminLaporan from './pages/admin/AdminLaporan';
import AnggotaLayout from './pages/anggota/AnggotaLayout';
import AnggotaDashboard from './pages/anggota/AnggotaDashboard';
import AnggotaKeuangan from './pages/anggota/AnggotaKeuangan';
import AnggotaProfil from './pages/anggota/AnggotaProfil';
import { UserRole } from './types';
import AdminKeuanganDetail from './pages/admin/AdminKeuanganDetail';
import SlipRincian from './pages/anggota/SlipRincian';
import AnggotaPinjaman from './pages/anggota/AnggotaPinjaman';
import AdminPinjaman from './pages/admin/AdminPinjaman';
import AdminPinjamanDetail from './pages/admin/AdminPinjamanDetail';
import BeritaPage from './pages/BeritaPage';
import AdminPengumuman from './pages/admin/AdminPengumuman';
import AdminTransaksi from './pages/admin/AdminTransaksi';
import AdminPengaturan from './pages/admin/AdminPengaturan';
import AdminProfil from './pages/admin/AdminProfil';
import AdminRiwayatTransaksi from './pages/admin/AdminRiwayatTransaksi';
import AdminRekapTransaksiManual from './pages/admin/AdminRekapSetoran';
import AdminPengaturanKewajiban from './pages/admin/AdminPengaturanKewajiban';

const PWAUpdatePrompt: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => (
  <div className="fixed bottom-4 right-4 z-50 bg-surface text-dark p-4 rounded-lg shadow-lg flex items-center gap-4 animate-fade-in-up">
    <div>
      <p className="font-bold">Update Tersedia!</p>
      <p className="text-sm">Versi baru aplikasi telah siap.</p>
    </div>
    <button
      onClick={onUpdate}
      className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-accent-dark transition-colors"
    >
      Muat Ulang
    </button>
  </div>
);


const App: React.FC = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // This promise resolves only when a service worker is active.
        // The registration object is now guaranteed to be available.

        // Listen for future updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setIsUpdateAvailable(true);
              }
            });
          }
        });

        // Handle case where a new worker is already waiting
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setIsUpdateAvailable(true);
        }
      }).catch(error => {
          console.error('Service Worker .ready failed:', error);
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // Reload the page once the new service worker has taken control.
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
    }
  };

  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
      {isUpdateAvailable && <PWAUpdatePrompt onUpdate={handleUpdate} />}
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === UserRole.ADMIN ? '/admin/dashboard' : '/anggota/dashboard'} />} />
      <Route path="/berita" element={<BeritaPage />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={user?.role === UserRole.ADMIN ? <AdminLayout /> : <Navigate to="/login" />}
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="profil" element={<AdminProfil />} />
        <Route path="anggota" element={<AdminAnggota />} />
        <Route path="upload" element={<AdminUpload />} />
        <Route path="transaksi" element={<AdminTransaksi />} />
        <Route path="laporan" element={<AdminLaporan />} />
        <Route path="pinjaman" element={<AdminPinjaman />} />
        <Route path="pinjaman/:id" element={<AdminPinjamanDetail />} />
        <Route path="keuangan/:no_anggota" element={<AdminKeuanganDetail />} />
        <Route path="pengumuman" element={<AdminPengumuman />} />
        <Route path="riwayat-transaksi" element={<AdminRiwayatTransaksi />} />
        <Route path="rekap-transaksi" element={<AdminRekapTransaksiManual />} />
        <Route 
          path="pengaturan-admin" 
          element={user?.email === 'admin@koperasi13.com' ? <AdminPengaturan /> : <Navigate to="/admin/dashboard" />} 
        />
         <Route 
          path="pengaturan-kewajiban" 
          element={user?.email === 'admin@koperasi13.com' ? <AdminPengaturanKewajiban /> : <Navigate to="/admin/dashboard" />} 
        />
        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      {/* Anggota Routes */}
      <Route
        path="/anggota"
        element={user?.role === UserRole.ANGGOTA ? <AnggotaLayout /> : <Navigate to="/login" />}
      >
        <Route path="dashboard" element={<AnggotaDashboard />} />
        <Route path="keuangan" element={<AnggotaKeuangan />} />
        <Route path="profil" element={<AnggotaProfil />} />
        <Route path="pinjaman" element={<AnggotaPinjaman />} />
        <Route path="slip" element={<SlipRincian />} />
        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      <Route path="*" element={<Navigate to="/berita" />} />
    </Routes>
  );
};

export default App;