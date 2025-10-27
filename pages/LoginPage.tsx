// FIX: Implemented full content for LoginPage.tsx to provide a functional login screen.
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DownloadIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon } from '../components/icons/Icons';
import { registerAnggota, getAnggotaByNo, generateNewAnggotaNo, registerNewAnggota } from '../services/anggotaService';
import { Logo } from '../components/icons/Logo';
import { getPengaturanKewajiban, PengaturanKewajiban } from '../services/pengaturanService';

type ViewState = 'login' | 'activate' | 'register-new';

const LoginPage: React.FC = () => {
  const [view, setView] = useState<ViewState>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAnggotaName, setLoginAnggotaName] = useState<string | null>(null);
  
  // Activate State
  const [activateNoAnggota, setActivateNoAnggota] = useState('');
  const [activateNoHp, setActivateNoHp] = useState('');
  const [activatePassword, setActivatePassword] = useState('');
  const [activateAnggotaName, setActivateAnggotaName] = useState<string | null>(null);

  // New Member Registration State
  const [regNama, setRegNama] = useState('');
  const [regAlamat, setRegAlamat] = useState('');
  const [regStatus, setRegStatus] = useState<'AK' | 'PB' | 'WL'>('WL');
  const [regNoAnggota, setRegNoAnggota] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [kewajiban, setKewajiban] = useState<PengaturanKewajiban | null>(null);

  // General State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKewajibanVisible, setIsKewajibanVisible] = useState(false);
  const [isNameLoading, setIsNameLoading] = useState(false);
  const { login } = useAuth();
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // PWA Install Prompt Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => {
      setInstallPrompt(null);
    });
  };

  // Fetch kewajiban settings
  useEffect(() => {
    const fetchSettings = async () => {
        const data = await getPengaturanKewajiban();
        if (data) {
            setKewajiban(data);
        }
    };
    fetchSettings();
  }, []);

  // Name check for Login and Activation forms
  useEffect(() => {
    const searchInput = view === 'login' ? username : activateNoAnggota;
    const setName = view === 'login' ? setLoginAnggotaName : setActivateAnggotaName;

    if (view === 'register-new' || !searchInput || (view === 'login' && searchInput.includes('@'))) {
        setName(null);
        setIsNameLoading(false);
        return;
    }

    setIsNameLoading(true);
    const handler = setTimeout(async () => {
        try {
            const anggota = await getAnggotaByNo(searchInput.toUpperCase());
            setName(anggota ? anggota.nama : 'Anggota tidak ditemukan');
        } catch (err) {
            setName('Gagal memuat nama');
        } finally {
            setIsNameLoading(false);
        }
    }, 500);

    return () => clearTimeout(handler);
  }, [username, activateNoAnggota, view]);

  // Auto-generate new member number for registration form
  useEffect(() => {
      if (view === 'register-new') {
          const generateNo = async () => {
              setIsLoading(true);
              const newNo = await generateNewAnggotaNo(regStatus);
              setRegNoAnggota(newNo);
              setIsLoading(false);
          };
          generateNo();
      }
  }, [view, regStatus]);

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

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
        await registerAnggota(activateNoAnggota, activateNoHp, activatePassword);
        setSuccess('Aktivasi berhasil! Silakan login dengan akun baru Anda.');
        switchView('login');
    } catch (err: any) {
        setError(err.message || 'Aktivasi gagal.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleNewMemberRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!regNoAnggota) {
          setError('Nomor anggota belum berhasil dibuat. Mohon tunggu sebentar.');
          return;
      }
      setError('');
      setSuccess('');
      setIsLoading(true);
      try {
          await registerNewAnggota({
              nama: regNama,
              alamat: regAlamat,
              no_anggota: regNoAnggota,
              password: regPassword
          });
          setSuccess('Pendaftaran berhasil! Silakan login dengan nomor anggota dan password baru Anda.');
          switchView('login');
      } catch (err: any) {
          setError(err.message || 'Pendaftaran gagal.');
      } finally {
          setIsLoading(false);
      }
  };

  const switchView = (targetView: ViewState) => {
    setView(targetView);
    setError('');
    setSuccess('');
    // Reset all form states
    setUsername(''); setPassword(''); setLoginAnggotaName(null);
    setActivateNoAnggota(''); setActivateNoHp(''); setActivatePassword(''); setActivateAnggotaName(null);
    setRegNama(''); setRegAlamat(''); setRegStatus('WL'); setRegPassword(''); setRegNoAnggota('');
  }
  
  const formatCurrency = (amount: number) => `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;

  const InstallBanner = () => (
    <div className="bg-dark text-white p-6 shadow-lg rounded-lg animate-fade-in-up">
        <div className="flex flex-col items-start gap-4">
            <div>
                <h3 className="text-lg font-bold">Instal Aplikasi untuk Pengalaman Terbaik</h3>
                <p className="text-sm text-slate-300 mt-1">
                    Akses lebih cepat dan fitur offline dengan menambahkan aplikasi ini ke layar utama (home screen) Anda.
                </p>
            </div>
            <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-secondary font-bold rounded-lg hover:bg-secondary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-secondary"
            >
                <DownloadIcon className="w-5 h-5" />
                <span>Instal Aplikasi</span>
            </button>
        </div>
    </div>
  );
  
  const getTitle = () => {
      switch(view) {
          case 'login': return 'Masuk ke Akun Anda';
          case 'activate': return 'Aktivasi Akun Anggota';
          case 'register-new': return 'Daftar Anggota Baru';
      }
  }
  
  const getSubtitle = () => {
       switch(view) {
          case 'login': return 'Silakan masukkan kredensial Anda.';
          case 'activate': return 'Untuk anggota yang sudah terdaftar di koperasi.';
          case 'register-new': return 'Lengkapi data untuk menjadi anggota baru.';
      }
  }
  
  const getHeaderName = () => {
      if (isNameLoading) return '...';
      switch(view) {
          case 'login': return loginAnggotaName;
          case 'activate': return activateAnggotaName;
          case 'register-new': return regNama || 'Calon Anggota Baru';
          default: return 'Selamat Datang';
      }
  }


  return (
    <div className="min-h-screen bg-background flex flex-col items-center font-sans">
        <header 
          className="relative w-full bg-primary text-white p-6 pt-8 pb-20 z-20 text-center flex flex-col items-center"
        >
             <div className="w-48 z-30 mb-2">
                <Logo />
            </div>
            <div className="relative z-20 w-full max-w-md">
                <p className="text-base sm:text-lg text-indigo-200 -mt-2">Sistem Informasi Koperasi Karyawan SMPN 13 Tasikmalaya</p>
                <div className="mt-4 transition-all duration-300 min-h-[28px] flex items-center justify-center">
                    <p className="text-base sm:text-lg font-bold bg-slate-200 text-dark px-4 py-1 rounded-full">
                      {getHeaderName() || 'Selamat Datang'}
                    </p>
                </div>
            </div>
             <div className="absolute bottom-0 left-0 w-full h-12 bg-background rounded-t-3xl z-10"></div>
        </header>

        <main className="relative w-full flex-grow bg-background z-10 p-4 sm:p-8 flex flex-col items-center -mt-10">
           <div className="w-full max-w-md z-10 bg-surface shadow-lg rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-dark mb-1 text-center">{getTitle()}</h2>
                <p className="text-sm text-gray-500 mb-6 text-center">{getSubtitle()}</p>
                
                {error && <p className="text-sm text-red-600 text-center font-semibold bg-red-50 p-3 rounded-md mb-4">{error}</p>}
                {success && <p className="text-sm text-green-600 text-center font-semibold bg-green-50 p-3 rounded-md mb-4">{success}</p>}

                {view === 'login' && (
                  <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                      <input type="text" autoComplete="username" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface" placeholder="No. Anggota / Email Admin" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} autoComplete="current-password" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 text-sm font-bold rounded-lg text-dark bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors disabled:bg-gray-400">{isLoading ? 'MEMPROSES...' : 'LOGIN'}</button>
                    <p className="text-center text-sm text-gray-600 pt-2">Sudah jadi anggota?{' '} <button type="button" onClick={() => switchView('activate')} className="font-medium text-primary hover:underline">Aktivasi Akun</button></p>
                    <p className="text-center text-sm text-gray-600">Belum jadi anggota?{' '} <button type="button" onClick={() => switchView('register-new')} className="font-medium text-primary hover:underline">Daftar Disini</button></p>
                  </form>
                )}
                
                {view === 'activate' && (
                <form className="space-y-4" onSubmit={handleActivate}>
                    <div><input type="text" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface" placeholder="No. Anggota" value={activateNoAnggota} onChange={(e) => setActivateNoAnggota(e.target.value)} /></div>
                    <div><input type="tel" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface" placeholder="No. HP (Contoh: 081234...)" value={activateNoHp} onChange={(e) => setActivateNoHp(e.target.value)} /></div>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface" placeholder="Buat Password Baru" value={activatePassword} onChange={(e) => setActivatePassword(e.target.value)} />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                    </div>
                    <button type="submit" disabled={isLoading || !activateAnggotaName || activateAnggotaName === 'Anggota tidak ditemukan'} className="w-full py-3 px-4 text-sm font-bold rounded-lg text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors disabled:bg-gray-400">{isLoading ? 'MEMPROSES...' : 'AKTIVASI AKUN'}</button>
                    <p className="text-center text-sm text-gray-600 pt-2">Sudah punya akun?{' '} <button type="button" onClick={() => switchView('login')} className="font-medium text-primary hover:underline">Login</button></p>
                </form>
                )}

                {view === 'register-new' && (
                    <form className="space-y-4" onSubmit={handleNewMemberRegister}>
                        <div><input type="text" required value={regNama} onChange={(e) => setRegNama(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Nama Lengkap" /></div>
                        <div><textarea value={regAlamat} onChange={(e) => setRegAlamat(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Alamat" required rows={2}></textarea></div>
                        <div>
                            <select value={regStatus} onChange={(e) => setRegStatus(e.target.value as any)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-surface">
                                <option value="AK">Pegawai Aktif SMPN 13 Tasikmalaya</option>
                                <option value="PB">Purna Bakti SMPN 13 Tasikmalaya</option>
                                <option value="WL">Warga Luar SMPN 13 Tasikmalaya</option>
                            </select>
                        </div>
                        <div><input type="text" value={isLoading ? 'Membuat kode...' : regNoAnggota} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100" placeholder="Kode Anggota" readOnly /></div>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Buat Password" required />
                             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                            <button 
                                type="button"
                                onClick={() => setIsKewajibanVisible(!isKewajibanVisible)}
                                className="w-full flex justify-between items-center text-left"
                                aria-expanded={isKewajibanVisible}
                            >
                                <h4 className="font-bold">Kewajiban Anggota Baru:</h4>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isKewajibanVisible ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isKewajibanVisible ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Simpanan Pokok:</strong> {kewajiban ? formatCurrency(kewajiban.simpananPokok) : 'Rp 25.000'} (sekali bayar).</li>
                                    <li><strong>Simpanan Wajib:</strong> {kewajiban ? `${formatCurrency(kewajiban.simpananWajibMin)} - ${formatCurrency(kewajiban.simpananWajibMax)}` : 'Rp 100.000 - Rp 200.000'} (per bulan).</li>
                                    <li><strong>Dana Perlaya:</strong> {kewajiban ? formatCurrency(kewajiban.danaPerlaya) : 'Rp 5.000'} (per bulan).</li>
                                    <li><strong>Dana Katineng:</strong> {kewajiban ? formatCurrency(kewajiban.danaKatineng) : 'Rp 5.000'} (per bulan).</li>
                                </ul>
                                <p className="text-xs mt-2 italic">Pembayaran akan diproses oleh Admin pada laporan bulanan.</p>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full py-3 px-4 text-sm font-bold rounded-lg text-white bg-secondary hover:bg-secondary-dark disabled:bg-gray-400">{isLoading ? 'MEMPROSES...' : 'DAFTAR SEBAGAI ANGGOTA BARU'}</button>
                        <p className="text-center text-sm text-gray-600 pt-2">Sudah punya akun?{' '} <button type="button" onClick={() => switchView('login')} className="font-medium text-primary hover:underline">Login</button></p>
                    </form>
                )}
                
                <div className="mt-6 text-center border-t pt-4">
                  <Link to="/berita" className="text-sm font-medium text-primary hover:underline">Lihat Pengumuman Koperasi &rarr;</Link>
                </div>
           </div>

           {installPrompt && (
                <div className="w-full max-w-md md:fixed md:bottom-4 md:right-4 md:max-w-sm md:w-auto z-50 mt-8">
                    <InstallBanner />
                </div>
            )}
        </main>
    </div>
  );
};

export default LoginPage;