// FIX: Implemented full content for LoginPage.tsx to provide a functional login screen.
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BuildingOfficeIcon } from '../components/icons/Icons';
import { registerAnggota, getAnggotaByNo } from '../services/anggotaService';

const LoginPage: React.FC = () => {
  const [view, setView] = useState<'login' | 'register'>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regNoAnggota, setRegNoAnggota] = useState('');
  const [regNoHp, setRegNoHp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [anggotaName, setAnggotaName] = useState<string | null>(null);
  const [isNameLoading, setIsNameLoading] = useState(false);


  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  
  useEffect(() => {
    if (view !== 'register') return;

    if (!regNoAnggota) {
        setAnggotaName(null);
        setIsNameLoading(false);
        return;
    }

    setIsNameLoading(true);
    const handler = setTimeout(() => {
        const fetchAnggotaName = async () => {
            try {
                const anggota = await getAnggotaByNo(regNoAnggota);
                if (anggota) {
                    setAnggotaName(anggota.nama);
                } else {
                    setAnggotaName('No. Anggota tidak ditemukan');
                }
            } catch (err) {
                setAnggotaName('Gagal memuat nama');
            } finally {
                setIsNameLoading(false);
            }
        };
        fetchAnggotaName();
    }, 500); // 500ms delay

    return () => {
        clearTimeout(handler);
    };
  }, [regNoAnggota, view]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await login(username, password);
      // Navigation is handled by AppRoutes
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
        await registerAnggota(regNoAnggota, regNoHp, regPassword);
        setSuccess('Registrasi berhasil! Silakan login dengan password baru Anda.');
        setView('login'); // Switch back to login view
        // Clear registration form
        setRegNoAnggota('');
        setRegNoHp('');
        setRegPassword('');
    } catch (err: any) {
        setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
        setIsLoading(false);
    }
  };

  const switchView = (targetView: 'login' | 'register') => {
    setView(targetView);
    setError('');
    setSuccess('');
    // Clear form fields on view switch
    setUsername('');
    setPassword('');
    setRegNoAnggota('');
    setRegNoHp('');
    setRegPassword('');
    setAnggotaName(null);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-light">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
            <div className="flex flex-col justify-center items-center mb-4">
                <BuildingOfficeIcon className="w-12 h-12 text-primary" />
                <h1 className="text-2xl font-bold text-primary mt-2">e-Koperasi 13</h1>
                <p className="text-sm text-gray-500">Bina Warga</p>
            </div>
             <h2 className="text-xl font-semibold text-dark">{view === 'login' ? 'Selamat Datang' : 'Registrasi Akun'}</h2>
        </div>
        
        {error && <p className="text-sm text-red-600 text-center font-semibold bg-red-50 p-3 rounded-md">{error}</p>}
        {success && <p className="text-sm text-green-600 text-center font-semibold bg-green-50 p-3 rounded-md">{success}</p>}

        {view === 'login' ? (
            <form className="mt-6 space-y-6" onSubmit={handleLogin}>
              <div>
                  <label htmlFor="username" className="sr-only">
                    Username / No. Anggota
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Username / No. Anggota"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password"className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Memproses...' : 'Login'}
                </button>
              </div>
               <p className="text-center text-sm text-gray-600">
                    Belum punya akun?{' '}
                    <button type="button" onClick={() => switchView('register')} className="font-medium text-primary hover:underline">
                        Registrasi di sini
                    </button>
                </p>
            </form>
        ) : (
            <form className="mt-6 space-y-6" onSubmit={handleRegister}>
                 <div>
                    <label htmlFor="regNoAnggota" className="sr-only">No. Anggota</label>
                    <input
                        id="regNoAnggota"
                        type="text"
                        required
                        className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="No. Anggota"
                        value={regNoAnggota}
                        onChange={(e) => setRegNoAnggota(e.target.value)}
                    />
                    <div className="pt-2 text-sm text-gray-600 min-h-[20px]">
                        {isNameLoading && <span className="italic">Mencari nama...</span>}
                        {anggotaName && !isNameLoading && (
                            <span className={anggotaName === 'No. Anggota tidak ditemukan' ? 'text-red-500 font-medium' : 'text-green-600 font-semibold'}>
                                {anggotaName}
                            </span>
                        )}
                    </div>
                </div>
                <div>
                  <label htmlFor="regNoHp" className="sr-only">
                    No. HP
                  </label>
                  <input
                    id="regNoHp"
                    type="tel"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="No. HP (Contoh: 08123456789)"
                    value={regNoHp}
                    onChange={(e) => setRegNoHp(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="regPassword"className="sr-only">
                    Password Baru
                  </label>
                  <input
                    id="regPassword"
                    type="password"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Buat Password Baru"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Memproses...' : 'Daftar'}
                </button>
              </div>
                <p className="text-center text-sm text-gray-600">
                    Sudah punya akun?{' '}
                    <button type="button" onClick={() => switchView('login')} className="font-medium text-primary hover:underline">
                        Login di sini
                    </button>
                </p>
            </form>
        )}

      </div>
    </div>
  );
};

export default LoginPage;