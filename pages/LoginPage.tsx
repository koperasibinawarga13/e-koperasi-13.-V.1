
// FIX: Implemented full content for LoginPage.tsx to provide a functional login screen.
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DownloadIcon, EyeIcon, EyeSlashIcon } from '../components/icons/Icons';
import { registerAnggota, getAnggotaByNo } from '../services/anggotaService';
import { LogoKoperasi } from '../components/icons/LogoKoperasi';
import { LoginIllustration } from '../components/icons/LoginIllustration';

const LoginPage: React.FC = () => {
  const [view, setView] = useState<'login' | 'register'>('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAnggotaName, setLoginAnggotaName] = useState<string | null>(null);
  
  const [regNoAnggota, setRegNoAnggota] = useState('');
  const [regNoHp, setRegNoHp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAnggotaName, setRegAnggotaName] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNameLoading, setIsNameLoading] = useState(false);
  const { login } = useAuth();
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    installPrompt?.prompt();
    installPrompt?.userChoice.then(() => setInstallPrompt(null));
  };

  useEffect(() => {
    const searchInput = view === 'login' ? username : regNoAnggota;
    const setName = view === 'login' ? setLoginAnggotaName : setRegAnggotaName;

    if (!searchInput || (view === 'login' && searchInput.includes('@'))) {
        setName(null);
        setIsNameLoading(false);
        return;
    }

    setIsNameLoading(true);
    const handler = setTimeout(async () => {
        try {
            // FIX: Convert search input to uppercase for case-insensitive matching
            const anggota = await getAnggotaByNo(searchInput.toUpperCase());
            setName(anggota ? anggota.nama : 'Anggota tidak ditemukan');
        } catch (err) {
            setName('Gagal memuat nama');
        } finally {
            setIsNameLoading(false);
        }
    }, 500);

    return () => clearTimeout(handler);
  }, [username, regNoAnggota, view]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
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
        setSuccess('Registrasi berhasil! Silakan login.');
        switchView('login');
    } catch (err: any) {
        setError(err.message || 'Registrasi gagal.');
    } finally {
        setIsLoading(false);
    }
  };

  const switchView = (targetView: 'login' | 'register') => {
    setView(targetView);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setRegNoAnggota('');
    setRegNoHp('');
    setRegPassword('');
    setLoginAnggotaName(null);
    setRegAnggotaName(null);
  }

  const InstallBanner = () => (
    <div className="bg-[#2d3748] text-white p-6 shadow-lg rounded-lg animate-fade-in-up">
        <div className="flex flex-col items-start gap-4">
            <div>
                <h3 className="text-lg font-bold">Instal Aplikasi untuk Pengalaman Terbaik</h3>
                <p className="text-sm text-slate-300 mt-1">
                    Akses lebih cepat dan fitur offline dengan menambahkan aplikasi ini ke layar utama (home screen) Anda.
                </p>
            </div>
            <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-secondary font-bold rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2d3748] focus:ring-secondary"
            >
                <DownloadIcon className="w-5 h-5" />
                <span>Instal Aplikasi</span>
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center font-sans overflow-hidden">
        <header className="relative w-full bg-primary text-white p-6 pt-10 z-10 text-center flex flex-col items-center">
             <div className="absolute -bottom-10 w-20 h-20 bg-white rounded-full p-1.5 shadow-lg flex items-center justify-center z-30">
                <LogoKoperasi className="w-full h-full text-primary" />
            </div>
            <div className="relative z-10 w-full max-w-md">
                <h1 className="text-3xl sm:text-4xl font-bold">e-Koperasi</h1>
                <p className="text-base sm:text-lg opacity-90 mt-1">Bina warga SMP Negeri 13 Tasikmalaya</p>
                <div className="mt-4 transition-all duration-300 min-h-[28px] flex items-center justify-center">
                    <p className="text-base sm:text-lg font-bold bg-black/10 px-4 py-1 rounded-full">
                      {isNameLoading ? '...' : (view === 'login' ? loginAnggotaName : regAnggotaName) || 'Selamat Datang'}
                    </p>
                </div>
            </div>
             <div className="absolute bottom-0 left-0 w-full h-12 bg-background rounded-t-3xl z-20"></div>
        </header>

        <main className="relative w-full flex-grow bg-background z-10 p-4 sm:p-8 flex flex-col items-center">
           <LoginIllustration className="absolute bottom-0 right-0 w-48 h-auto z-0 opacity-80" />
           <div className="w-full max-w-md z-10 pt-8 pb-12">
                <h2 className="text-xl sm:text-2xl font-bold text-dark mb-1">{view === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}</h2>
                <p className="text-sm text-gray-500 mb-6">{view === 'login' ? 'Silakan masukkan kredensial Anda.' : 'Lengkapi data untuk mendaftar.'}</p>
                
                {error && <p className="text-sm text-red-600 text-center font-semibold bg-red-50 p-3 rounded-md mb-4">{error}</p>}
                {success && <p className="text-sm text-green-600 text-center font-semibold bg-green-50 p-3 rounded-md mb-4">{success}</p>}

                {view === 'login' ? (
                  <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                      <input
                        type="text"
                        autoComplete="username"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        placeholder="No. Anggota / Email Admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                        {showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 text-sm font-bold rounded-lg text-dark bg-accent hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors disabled:bg-gray-400"
                    >
                      {isLoading ? 'MEMPROSES...' : 'LOGIN'}
                    </button>
                    <p className="text-center text-sm text-gray-600 pt-2">
                        Belum punya akun?{' '}
                        <button type="button" onClick={() => switchView('register')} className="font-medium text-primary hover:underline">
                            Registrasi
                        </button>
                    </p>
                </form>
                ) : (
                <form className="space-y-4" onSubmit={handleRegister}>
                    <div>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                            placeholder="No. Anggota"
                            value={regNoAnggota}
                            onChange={(e) => setRegNoAnggota(e.target.value)}
                        />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        placeholder="No. HP (Contoh: 081234...)"
                        value={regNoHp}
                        onChange={(e) => setRegNoHp(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        placeholder="Buat Password Baru"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                        {showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !regAnggotaName || regAnggotaName === 'Anggota tidak ditemukan'}
                      className="w-full py-3 px-4 text-sm font-bold rounded-lg text-white bg-secondary hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors disabled:bg-gray-400"
                    >
                      {isLoading ? 'MEMPROSES...' : 'DAFTAR'}
                    </button>
                    <p className="text-center text-sm text-gray-600 pt-2">
                        Sudah punya akun?{' '}
                        <button type="button" onClick={() => switchView('login')} className="font-medium text-primary hover:underline">
                            Login
                        </button>
                    </p>
                </form>
                )}
           </div>

           {/* MODIFICATION FOR TESTING & RESPONSIVENESS */}
            {true && (
                <div className="w-full max-w-md md:fixed md:bottom-4 md:right-4 md:max-w-sm md:w-auto z-50">
                    <InstallBanner />
                </div>
            )}
        </main>
    </div>
  );
};

export default LoginPage;