import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock authentication logic
    if (email === 'admin@koperasi.com' && password === 'admin123') {
      const adminUser = {
        id: 'admin01',
        name: 'Admin Koperasi',
        email: 'admin@koperasi.com',
        role: UserRole.ADMIN,
      };
      login(adminUser);
      navigate('/admin/dashboard');
    } else if (email === 'anggota@koperasi.com' && password === 'anggota123') {
      const anggotaUser = {
        id: 'anggota01',
        name: 'Budi Santoso',
        email: 'anggota@koperasi.com',
        role: UserRole.ANGGOTA,
        anggotaId: 'AGT001',
      };
      login(anggotaUser);
      navigate('/anggota/dashboard');
    } else {
      setError('Email atau password salah.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-light">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">e-Koperasi 13</h1>
            <p className="text-gray-500">Bina Warga</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Alamat email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Login
            </button>
          </div>
        </form>
         <div className="text-center text-sm text-gray-500">
            <p>Admin: admin@koperasi.com / admin123</p>
            <p>Anggota: anggota@koperasi.com / anggota123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
