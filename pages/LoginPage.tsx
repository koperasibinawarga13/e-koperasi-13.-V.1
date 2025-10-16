// FIX: Implemented full content for LoginPage.tsx to provide a functional login screen.
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DownloadIcon, EyeIcon, EyeSlashIcon } from '../components/icons/Icons';
import { registerAnggota, getAnggotaByNo } from '../services/anggotaService';

const WaveBackground = () => (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
            <path fill="#0052FF" fillOpacity="1" d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,240C672,267,768,277,864,256C960,235,1056,181,1152,154.7C1248,128,1344,128,1392,128L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
            <path fill="#0033A1" fillOpacity="0.5" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,245.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
    </div>
);

const CustomerServiceIllustration = () => (
    <div className="absolute bottom-0 right-0 w-48 h-auto z-0 pointer-events-none">
        <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(100, 150)">
                {/* Head */}
                <circle cx="0" cy="-50" r="30" fill="#f2d6b8"/>
                {/* Hair */}
                <path d="M -30 -80 Q 0 -100 30 -80 L 35 -40 Q 0 -30 -35 -40 Z" fill="#333"/>
                <path d="M -20 -20 Q 0 -10 20 -20 L 25 10 Q 0 20 -25 10 Z" fill="#333"/>
                {/* Eyes */}
                <circle cx="-10" cy="-55" r="3" fill="#333"/>
                <circle cx="10" cy="-55" r="3" fill="#333"/>
                {/* Mouth */}
                <path d="M -10 -40 Q 0 -35 10 -40" stroke="#333" fill="none" strokeWidth="2"/>
                {/* Body */}
                <path d="M -40 -20 L -50 80 L 50 80 L 40 -20 Z" fill="#0052FF"/>
                {/* Arms */}
                <path d="M 40 -10 L 80 30 L 70 40 L 35 0 Z" fill="#0052FF"/>
                <path d="M -40 -10 L -80 30 L -70 40 L -35 0 Z" fill="#f2d6b8"/>
                {/* Shirt Collar */}
                <path d="M -20 -20 L 0 -5 L 20 -20 Z" fill="#f0e68c"/>
                <rect x="-40" y="-20" width="80" height="5" fill="#0033A1"/>
            </g>
        </svg>
    </div>
);


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
            const anggota = await getAnggotaByNo(searchInput);
            setName(anggota ? anggota.nama.split(' ')[0] : 'Anggota tidak ditemukan');
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

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-hidden">
        {installPrompt && (
          <button
              onClick={handleInstallClick}
              className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-full shadow-lg hover:bg-emerald-600 transition-transform transform hover:scale-105 focus:outline-none"
              title="Install Aplikasi"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Install App</span>
            </button>
        )}

        <header className="relative w-full h-2/5 min-h-[280px] bg-primary flex flex-col justify-center items-center text-white p-8 z-10 text-center">
            <WaveBackground />
            <div className="absolute top-4 left-4 text-white/80 text-sm">Cek Saldo Anda ▾</div>
            <div className="relative z-10">
                <p className="text-2xl opacity-90">Halo,</p>
                <h1 className="text-5xl font-bold uppercase transition-all duration-300 h-14">
                  {isNameLoading ? '...' : (view === 'login' ? loginAnggotaName : regAnggotaName) || 'Selamat Datang'}
                </h1>
            </div>
        </header>

        <main className="relative flex-grow w-full bg-white rounded-t-3xl shadow-2xl -mt-8 z-10 p-8 flex flex-col">
           <CustomerServiceIllustration />
           <div className="w-full max-w-md z-10">
                <h2 className="text-xl font-bold text-dark mb-1">{view === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}</h2>
                <p className="text-sm text-gray-500 mb-4">{view === 'login' ? 'Silakan masukkan kredensial Anda.' : 'Lengkapi data untuk mendaftar.'}</p>
                
                {error && <p className="text-sm text-red-600 text-center font-semibold bg-red-50 p-3 rounded-md mb-4">{error}</p>}
                {success && <p className="text-sm text-green-600 text-center font-semibold bg-green-50 p-3 rounded-md mb-4">{success}</p>}

                {view === 'login' ? (
                  <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                      <input
                        type="text"
                        autoComplete="username"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="No. Anggota"
                            value={regNoAnggota}
                            onChange={(e) => setRegNoAnggota(e.target.value)}
                        />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="No. HP (Contoh: 081234...)"
                        value={regNoHp}
                        onChange={(e) => setRegNoHp(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
        </main>
    </div>
  );
};

export default LoginPage;