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

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={user?.role === UserRole.ADMIN ? <AdminLayout /> : <Navigate to="/login" />}
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="anggota" element={<AdminAnggota />} />
        <Route path="upload" element={<AdminUpload />} />
        <Route path="laporan" element={<AdminLaporan />} />
        <Route path="pinjaman" element={<AdminPinjaman />} />
        <Route path="keuangan/:no_anggota" element={<AdminKeuanganDetail />} />
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

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;