
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { BuildingOfficeIcon } from '../components/icons/Icons';

const LoginPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.ANGGOTA);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      login(role);
      const path = role === UserRole.ADMIN ? '/admin/dashboard' : '/anggota/dashboard';
      navigate(path);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center">
            <div className="flex justify-center items-center mb-4">
                <BuildingOfficeIcon className="w-12 h-12 text-primary" />
                <h1 className="text-4xl font-bold ml-3 text-dark">Binawarga</h1>
            </div>
          <h2 className="text-2xl font-bold text-gray-800">Selamat Datang!</h2>
          <p className="text-gray-500 mt-2">Silakan login untuk mengakses akun Anda.</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email / ID Anggota
            </label>
            <input
              id="email"
              name="email"
              type="text"
              required
              defaultValue={role === UserRole.ADMIN ? 'admin@binawarga.com' : 'ANGGOTA-001'}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="password"  className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              defaultValue="password"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
             <label className="text-sm font-medium text-gray-700">Login sebagai</label>
             <div className="mt-2 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRole(UserRole.ANGGOTA)} className={`px-4 py-3 rounded-lg text-sm font-semibold ${role === UserRole.ANGGOTA ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}>Anggota</button>
                <button type="button" onClick={() => setRole(UserRole.ADMIN)} className={`px-4 py-3 rounded-lg text-sm font-semibold ${role === UserRole.ADMIN ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}>Admin</button>
             </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:bg-gray-400"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
