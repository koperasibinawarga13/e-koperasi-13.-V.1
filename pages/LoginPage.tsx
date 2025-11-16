// FIX: Implemented full content for LoginPage.tsx to provide a functional login screen.
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DownloadIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon } from '../components/icons/Icons';
import { registerAnggota, generateNewAnggotaNo, registerNewAnggota } from '../services/anggotaService';
import { Logo } from '../components/icons/Logo';
import { getPengaturanKewajiban, PengaturanKewajiban } from '../services/pengaturanService';

type ViewState = 'login' | 'activate' | 'register-new';

// FIX: Changed to a named export to resolve a "no default export" error.
export const LoginPage: React.FC = () => {
  const [view, setView] = useState<ViewState>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Activate State
  const [activateNoAnggota, setActivateNoAnggota] = useState('');
  const [activateNoHp, setActivateNoHp] = useState('');
  const [activatePassword, setActivatePassword] = useState('');

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
  const { login } = useAuth();

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
    setUsername(''); setPassword('');
    setActivateNoAnggota(''); setActivateNoHp(''); setActivatePassword('');
    setRegNama(''); setRegAlamat(''); setRegStatus('WL'); setRegPassword(''); setRegNoAnggota('');
  }
  
  const formatCurrency = (amount: number) => `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;

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


  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 font-sans bg-background">
        <div className="w-full max-w-sm">
            <div className="flex justify-center mb-6">
                <Logo className="h-16 w-auto text-dark" />
            </div>
            
            <div className="flex justify-center mb-6">
                <span className="bg-sky-100 text-sky-700 text-sm font-semibold px-5 py-2 rounded-full shadow-sm">
                    Selamat Datang
                </span>
            </div>
            
            <div className="w-full bg-surface shadow-md rounded-xl p-8 border border-slate-200">
                <h2 className="text-2xl font-bold text-dark text-center mb-1">{getTitle()}</h2>
                <p className="text-center text-gray-text text-sm mb-6">{getSubtitle()}</p>
                
                {error && <p className="text-sm text-red-600 text-center font-semibold bg-red-100 p-3 rounded-md mb-4">{error}</p>}
                {success && <p className="text-sm text-green-600 text-center font-semibold bg-green-100 p-3 rounded-md mb-4">{success}</p>}

                {view === 'login' && (
                  <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                      <input type="text" autoComplete="username" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-slate-50 placeholder-slate-400 text-dark" placeholder="No. Anggota / Email Admin" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} autoComplete="current-password" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-slate-50 placeholder-slate-400 text-dark" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                      </button>
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={isLoading} className="w-full text-center py-3 px-4 text-sm font-bold tracking-widest rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary transition-colors disabled:bg-slate-400 disabled:text-slate-200">
                            {isLoading ? 'MEMPROSES...' : 'LOGIN'}
                        </button>
                    </div>
                     <div className="text-center text-sm text-gray-text space-y-2 pt-2">
                        <p>
                            Sudah jadi anggota?{' '} 
                            <button type="button" onClick={() => switchView('activate')} className="font-semibold text-primary hover:text-primary-dark hover:underline">Aktivasi Akun</button>
                        </p>
                        <p>
                            Belum jadi anggota?{' '} 
                            <button type="button" onClick={() => switchView('register-new')} className="font-semibold text-primary hover:text-primary-dark hover:underline">Daftar Disini</button>
                        </p>
                    </div>
                  </form>
                )}
                
                {view === 'activate' && (
                <form className="space-y-4" onSubmit={handleActivate}>
                    <div><input type="text" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-slate-50 placeholder-slate-400 text-dark" placeholder="No. Anggota" value={activateNoAnggota} onChange={(e) => setActivateNoAnggota(e.target.value)} /></div>
                    <div><input type="tel" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-slate-50 placeholder-slate-400 text-dark" placeholder="No. HP (Contoh: 081234...)" value={activateNoHp} onChange={(e) => setActivateNoHp(e.target.value)} /></div>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-slate-50 placeholder-slate-400 text-dark" placeholder="Buat Password Baru" value={activatePassword} onChange={(e) => setActivatePassword(e.target.value)} />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-slate-600">{showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 text-sm font-bold rounded-lg text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors disabled:bg-slate-400">{isLoading ? 'MEMPROSES...' : 'AKTIVASI AKUN'}</button>
                    <p className="text-center text-sm text-gray-text pt-2">Sudah punya akun?{' '} <button type="button" onClick={() => switchView('login')} className="font-medium text-primary hover:text-primary-dark hover:underline">Login</button></p>
                </form>
                )}

                {view === 'register-new' && (
                    <form className="space-y-4" onSubmit={handleNewMemberRegister}>
                        <div><input type="text" required value={regNama} onChange={(e) => setRegNama(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 placeholder-slate-400 text-dark" placeholder="Nama Lengkap" /></div>
                        <div><textarea value={regAlamat} onChange={(e) => setRegAlamat(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 placeholder-slate-400 text-dark" placeholder="Alamat" required rows={2}></textarea></div>
                        <div>
                            <select value={regStatus} onChange={(e) => setRegStatus(e.target.value as any)} className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-dark">
                                <option value="AK">Pegawai Aktif SMPN 13 Tasikmalaya</option>
                                <option value="PB">Purna Bakti SMPN 13 Tasikmalaya</option>
                                <option value="WL">Warga Luar SMPN 13 Tasikmalaya</option>
                            </select>
                        </div>
                        <div><input type="text" value={isLoading ? 'Membuat kode...' : regNoAnggota} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-100 text-slate-500" placeholder="Kode Anggota" readOnly /></div>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 placeholder-slate-400 text-dark" placeholder="Buat Password" required />
                             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-slate-600">{showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                        </div>
                        
                        <div className="bg-primary-light border border-primary/20 p-4 rounded-lg text-sm text-sky-800">
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

                        <button type="submit" disabled={isLoading} className="w-full py-3 px-4 text-sm font-bold rounded-lg text-white bg-secondary hover:bg-secondary-dark disabled:bg-slate-400">{isLoading ? 'MEMPROSES...' : 'DAFTAR SEBAGAI ANGGOTA BARU'}</button>
                        <p className="text-center text-sm text-gray-text pt-2">Sudah punya akun?{' '} <button type="button" onClick={() => switchView('login')} className="font-medium text-primary hover:text-primary-dark hover:underline">Login</button></p>
                    </form>
                )}
                
                <div className="mt-6 text-center border-t border-slate-200 pt-4">
                  <Link to="/berita" className="text-sm font-medium text-primary hover:underline">Lihat Pengumuman Koperasi &rarr;</Link>
                </div>
            </div>
        </div>
    </div>
  );
};