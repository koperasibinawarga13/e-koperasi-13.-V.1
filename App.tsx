import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
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