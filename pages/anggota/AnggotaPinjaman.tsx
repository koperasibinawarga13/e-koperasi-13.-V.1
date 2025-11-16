import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { getKeuanganByNoAnggota } from '../../services/keuanganService';
import { Keuangan, Anggota, PengajuanPinjaman } from '../../types';
import { getAnggotaById } from '../../services/anggotaService';
import { addPengajuanPinjaman, getPengajuanPinjamanByNoAnggota, deletePengajuanPinjaman } from '../../services/pinjamanService';
import { getPengaturanPinjaman } from '../../services/pengaturanService';

interface SimulasiResult {
    pokokPinjaman: number;
    jangkaWaktu: number;
    sukuBunga: number;
    tanggalMulai: string;
    angsuranPokokBulan: number;
    totalBunga: number;
    totalBayar: number;
    tanggalLunas: string;
    metode_perhitungan: 'Plat Pokok' | 'Plat Total';
    jadwal: Array<{
        bulan: number;
        tanggal: string;
        angsuranPokok: number;
        angsuranBunga: number;
        totalAngsuran: number;
        sisaPinjaman: number;
    }>;
}

const AnggotaPinjaman: React.FC = () => {
    const { user } = useAuth();
    const [keuangan, setKeuangan] = useState<Keuangan | null>(null);
    const [anggota, setAnggota] = useState<Anggota | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [riwayat, setRiwayat] = useState<PengajuanPinjaman[]>([]);
    
    // State for simulator
    const [pokokPinjaman, setPokokPinjaman] = useState(10000000);
    const [jangkaWaktu, setJangkaWaktu] = useState(12);
    const [sukuBunga, setSukuBunga] = useState(2); // Default, will be overwritten by settings
    const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
    const [simulasi, setSimulasi] = useState<SimulasiResult | null>(null);
    const [metodePerhitungan, setMetodePerhitungan] = useState<'plat_pokok' | 'plat_total'>('plat_total');


    // State for Pinjaman Khusus
    const [pokokPinjamanKhusus, setPokokPinjamanKhusus] = useState(0);
    const [keteranganKhusus, setKeteranganKhusus] = useState('');
    
    // General State
    const [activeTab, setActiveTab] = useState<'berjangka' | 'khusus' | 'pelunasan'>('berjangka');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: ''});
    const [isCancelling, setIsCancelling] = useState<string | null>(null);


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                 const settings = await getPengaturanPinjaman();
                if (settings) {
                    setSukuBunga(settings.sukuBunga);
                }

                if (user?.anggotaId) {
                    const anggotaData = await getAnggotaById(user.anggotaId);
                    setAnggota(anggotaData);
                    if (anggotaData?.no_anggota) {
                        const [keuanganResult, riwayatResult] = await Promise.all([
                            getKeuanganByNoAnggota(anggotaData.no_anggota),
                            getPengajuanPinjamanByNoAnggota(anggotaData.no_anggota)
                        ]);
                        setKeuangan(keuanganResult);
                        setRiwayat(riwayatResult);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch loan data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user, isSubmitting]); // Re-fetch on new submission

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitMessage({ type: '', text: '' });
        if (pokokPinjaman <= 0 || jangkaWaktu <= 0 || sukuBunga < 0) {
            alert("Mohon masukkan nilai yang valid.");
            return;
        }

        if (metodePerhitungan === 'plat_pokok') {
            const angsuranPokokBulan = pokokPinjaman / jangkaWaktu;
            const bungaPerBulanRate = sukuBunga / 100;
            let sisaPinjaman = pokokPinjaman;
            let totalBunga = 0;
            const jadwal = [];
            const startDate = new Date(tanggalMulai);

            for (let i = 1; i <= jangkaWaktu; i++) {
                const angsuranDate = new Date(startDate);
                angsuranDate.setMonth(startDate.getMonth() + i);
                
                const angsuranBunga = sisaPinjaman * bungaPerBulanRate;
                totalBunga += angsuranBunga;
                
                const sisaPinjamanSebelumAngsuran = sisaPinjaman;
                sisaPinjaman -= angsuranPokokBulan;
                
                // Adjust final principal payment to clear remaining balance due to floating point math
                const currentAngsuranPokok = (i === jangkaWaktu) ? sisaPinjamanSebelumAngsuran : angsuranPokokBulan;
                
                jadwal.push({
                    bulan: i,
                    tanggal: angsuranDate.toISOString().split('T')[0],
                    angsuranPokok: currentAngsuranPokok,
                    angsuranBunga: angsuranBunga,
                    totalAngsuran: currentAngsuranPokok + angsuranBunga,
                    sisaPinjaman: (i === jangkaWaktu) ? 0 : sisaPinjaman,
                });
            }
            
            setSimulasi({pokokPinjaman, jangkaWaktu, sukuBunga, tanggalMulai, angsuranPokokBulan, totalBunga, totalBayar: pokokPinjaman + totalBunga, tanggalLunas: jadwal[jadwal.length - 1].tanggal, jadwal, metode_perhitungan: 'Plat Pokok' });

        } else { // plat_total
            const bungaPerBulanRate = sukuBunga / 100;
            const n = jangkaWaktu;
            const p = pokokPinjaman;

            const totalAngsuranBulanan = p * (bungaPerBulanRate * Math.pow(1 + bungaPerBulanRate, n)) / (Math.pow(1 + bungaPerBulanRate, n) - 1);
            if (isNaN(totalAngsuranBulanan) || !isFinite(totalAngsuranBulanan)) {
                alert("Tidak dapat menghitung angsuran. Pastikan bunga dan jangka waktu valid.");
                return;
            }

            let sisaPinjaman = p;
            let totalBunga = 0;
            const jadwal = [];
            const startDate = new Date(tanggalMulai);

            for (let i = 1; i <= n; i++) {
                const angsuranDate = new Date(startDate);
                angsuranDate.setMonth(startDate.getMonth() + i);
                
                const angsuranBunga = sisaPinjaman * bungaPerBulanRate;
                
                let angsuranPokok = totalAngsuranBulanan - angsuranBunga;
                let currentTotalAngsuran = totalAngsuranBulanan;

                // Last payment adjustment to ensure loan is fully paid off
                if (i === n) {
                    angsuranPokok = sisaPinjaman;
                    currentTotalAngsuran = angsuranPokok + angsuranBunga;
                }
                
                totalBunga += angsuranBunga;
                sisaPinjaman -= angsuranPokok;

                jadwal.push({
                    bulan: i,
                    tanggal: angsuranDate.toISOString().split('T')[0],
                    angsuranPokok: angsuranPokok,
                    angsuranBunga: angsuranBunga,
                    totalAngsuran: currentTotalAngsuran,
                    sisaPinjaman: sisaPinjaman < 0.01 ? 0 : sisaPinjaman, // handle floating point residuals
                });
            }

            setSimulasi({
                pokokPinjaman: p, jangkaWaktu: n, sukuBunga, tanggalMulai, 
                angsuranPokokBulan: 0, // Not applicable for this method
                totalBunga: totalBunga, totalBayar: p + totalBunga, 
                tanggalLunas: jadwal[jadwal.length - 1].tanggal, 
                jadwal, 
                metode_perhitungan: 'Plat Total'
            });
        }
    };
    
    const handleAjukanPinjamanBerjangka = async () => {
        if (!simulasi || !anggota) return;
        setIsSubmitting(true);
        setSubmitMessage({ type: '', text: '' });
        try {
            await addPengajuanPinjaman({
                no_anggota: anggota.no_anggota,
                nama_anggota: anggota.nama,
                jenis_pinjaman: 'Berjangka',
                pokok_pinjaman: simulasi.pokokPinjaman,
                jangka_waktu: simulasi.jangkaWaktu,
                bunga_per_bulan: simulasi.sukuBunga,
                angsuran_pokok_bulan: simulasi.angsuranPokokBulan,
                total_bunga: simulasi.totalBunga,
                total_bayar: simulasi.totalBayar,
                jadwal_angsuran: simulasi.jadwal,
                metode_perhitungan: simulasi.metode_perhitungan,
            });
            setSubmitMessage({type: 'success', text: 'Pengajuan pinjaman berjangka berhasil dikirim.'});
            setSimulasi(null);
        } catch (error) {
            setSubmitMessage({type: 'error', text: 'Gagal mengirim pengajuan.'});
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAjukanPinjamanKhusus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!anggota || pokokPinjamanKhusus <= 0 || !keteranganKhusus) {
            alert('Mohon lengkapi jumlah pinjaman dan keterangan.');
            return;
        };
        setIsSubmitting(true);
        setSubmitMessage({ type: '', text: '' });
        try {
            await addPengajuanPinjaman({
                no_anggota: anggota.no_anggota,
                nama_anggota: anggota.nama,
                jenis_pinjaman: 'Khusus',
                pokok_pinjaman: pokokPinjamanKhusus,
                keterangan: keteranganKhusus,
            });
            setSubmitMessage({type: 'success', text: 'Pengajuan pinjaman khusus berhasil dikirim.'});
            setPokokPinjamanKhusus(0);
            setKeteranganKhusus('');
        } catch (error) {
            setSubmitMessage({type: 'error', text: 'Gagal mengirim pengajuan.'});
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleCancelPengajuan = async (id: string) => {
        if (!window.confirm("Apakah Anda yakin ingin membatalkan pengajuan pinjaman ini?")) {
            return;
        }
        setIsCancelling(id);
        setSubmitMessage({ type: '', text: '' });
        try {
            await deletePengajuanPinjaman(id);
            setRiwayat(prev => prev.filter(p => p.id !== id));
            setSubmitMessage({ type: 'success', text: 'Pengajuan berhasil dibatalkan.' });
        } catch (error) {
            console.error("Failed to cancel loan application:", error);
            setSubmitMessage({ type: 'error', text: 'Gagal membatalkan pengajuan.' });
        } finally {
            setIsCancelling(null);
        }
    };
    
    const InfoItem: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
        <div className={`flex justify-between items-center py-2 border-b border-zinc-800 ${className}`}>
            <span className="text-gray-text">{label}</span>
            <span className="font-semibold text-dark">{value}</span>
        </div>
    );

    const handleCurrencyChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
        setter(isNaN(numericValue) ? 0 : numericValue);
    };

    const StatusBadge: React.FC<{ status: PengajuanPinjaman['status'] }> = ({ status }) => {
        const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
        let colorClasses = '';
        switch (status) {
            case 'Menunggu Persetujuan': colorClasses = 'bg-amber-500/10 text-amber-400'; break;
            case 'Disetujui': colorClasses = 'bg-green-500/10 text-green-400'; break;
            case 'Ditolak': colorClasses = 'bg-red-500/10 text-red-400'; break;
        }
        return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
    };

    const sisaPokokPinjaman = keuangan?.akhir_pinjaman_berjangka || 0;
    const bungaBulanIni = sisaPokokPinjaman * (sukuBunga / 100);
    const totalPelunasan = sisaPokokPinjaman + bungaBulanIni;

    return (
        <div>
            <Header title="Pengajuan Pinjaman Anggota" />
            
            <div className="bg-surface rounded-xl mb-8 p-6">
                <h2 className="text-lg md:text-xl font-bold text-dark mb-4">Sisa Pinjaman Anda</h2>
                 <div className="px-0 pb-0">
                    {isLoading ? <p className="text-gray-text">Memuat data sisa pinjaman...</p> : keuangan ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-zinc-800 p-4 rounded-lg">
                                <p className="text-sm text-amber-400 font-medium">Sisa Pinjaman Berjangka</p>
                                <p className="text-xl md:text-2xl font-bold text-dark">{formatCurrency(keuangan.akhir_pinjaman_berjangka)}</p>
                            </div>
                            <div className="bg-zinc-800 p-4 rounded-lg">
                                <p className="text-sm text-orange-400 font-medium">Sisa Pinjaman Khusus</p>
                                <p className="text-xl md:text-2xl font-bold text-dark">{formatCurrency(keuangan.akhir_pinjaman_khusus)}</p>
                            </div>
                        </div>
                    ) : <p className="text-gray-text">Data pinjaman tidak ditemukan.</p>}
                </div>
            </div>

            <div className="bg-surface rounded-xl">
                <h2 className="text-lg md:text-xl font-bold text-dark p-4 -m-0">Simulasi & Pengajuan Kredit</h2>
                 <nav className="flex border-b border-zinc-800 px-2">
                    <button 
                        onClick={() => {setActiveTab('berjangka'); setSubmitMessage({type: '', text: ''})}} 
                        className={`py-3 px-4 font-semibold text-sm transition-colors duration-200 ${
                            activeTab === 'berjangka' 
                            ? 'text-primary border-b-2 border-primary' 
                            : 'text-gray-text hover:text-dark border-b-2 border-transparent'
                        }`}
                    >
                        Pinjaman Berjangka (Dengan Simulasi)
                    </button>
                    <button 
                        onClick={() => {setActiveTab('khusus'); setSubmitMessage({type: '', text: ''})}} 
                        className={`py-3 px-4 font-semibold text-sm transition-colors duration-200 ${
                            activeTab === 'khusus' 
                            ? 'text-primary border-b-2 border-primary' 
                            : 'text-gray-text hover:text-dark border-b-2 border-transparent'
                        }`}
                    >
                        Pinjaman Khusus
                    </button>
                     <button 
                        onClick={() => {setActiveTab('pelunasan'); setSubmitMessage({type: '', text: ''})}} 
                        className={`py-3 px-4 font-semibold text-sm transition-colors duration-200 ${
                            activeTab === 'pelunasan' 
                            ? 'text-primary border-b-2 border-primary' 
                            : 'text-gray-text hover:text-dark border-b-2 border-transparent'
                        }`}
                    >
                        Pelunasan Pinjaman
                    </button>
                 </nav>

                {activeTab === 'berjangka' ? (
                    <div className="p-6">
                        <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                            <div>
                                <label htmlFor="pokok" className="block text-sm font-medium text-gray-text">Pokok Pinjaman (IDR)</label>
                                <input type="text" inputMode="numeric" id="pokok" value={new Intl.NumberFormat('id-ID').format(pokokPinjaman)} onChange={handleCurrencyChange(setPokokPinjaman)} className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 text-dark"/>
                            </div>
                             <div>
                                <label htmlFor="jangka" className="block text-sm font-medium text-gray-text">Jangka Waktu (Bulan)</label>
                                <input type="number" id="jangka" value={jangkaWaktu} onChange={e => setJangkaWaktu(Number(e.target.value))} className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 text-dark" />
                            </div>
                             <div>
                                <label htmlFor="bunga" className="block text-sm font-medium text-gray-text">Bunga per Bulan (%)</label>
                                <input type="number" step="0.1" id="bunga" value={sukuBunga} readOnly disabled className="mt-1 block w-full bg-zinc-700 rounded-md py-2 px-3 text-gray-text cursor-not-allowed" />
                            </div>
                            <div className="md:col-span-2 lg:col-span-1">
                                <label htmlFor="tanggal" className="block text-sm font-medium text-gray-text">Tanggal Mulai</label>
                                <input type="date" id="tanggal" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 text-dark" />
                            </div>
                             <div className="md:col-span-2 lg:col-span-3">
                                <label className="block text-sm font-medium text-gray-text">Metode Perhitungan</label>
                                <div className="mt-2 flex items-center space-x-6 bg-zinc-800 p-2 rounded-lg">
                                    <label className={`flex-1 text-center py-1.5 rounded-md text-sm cursor-pointer transition-colors font-semibold ${metodePerhitungan === 'plat_total' ? 'text-primary' : 'text-gray-text'}`}>
                                        <input type="radio" name="metode" value="plat_total" checked={metodePerhitungan === 'plat_total'} onChange={() => { setMetodePerhitungan('plat_total'); setSimulasi(null); }} className="sr-only"/>
                                        Plat Total Angsuran
                                    </label>
                                    <label className={`flex-1 text-center py-1.5 rounded-md text-sm cursor-pointer transition-colors font-semibold ${metodePerhitungan === 'plat_pokok' ? 'text-primary' : 'text-gray-text'}`}>
                                        <input type="radio" name="metode" value="plat_pokok" checked={metodePerhitungan === 'plat_pokok'} onChange={() => { setMetodePerhitungan('plat_pokok'); setSimulasi(null); }} className="sr-only"/>
                                        Plat Pokok Angsuran
                                    </label>
                                </div>
                            </div>
                            <div className="md:col-span-2 lg:col-span-4">
                                <button type="submit" className="w-full bg-primary text-black py-2.5 px-4 rounded-lg font-semibold hover:bg-primary-dark">Hitung Simulasi</button>
                            </div>
                        </form>
                        {simulasi && (
                        <div className="mt-8 text-center border-t border-zinc-800 pt-6">
                            <button onClick={handleAjukanPinjamanBerjangka} disabled={isSubmitting} className="bg-secondary text-white py-3 px-8 rounded-lg font-bold text-base md:text-lg hover:bg-secondary-dark disabled:bg-zinc-700">
                                {isSubmitting ? 'Mengirim...' : 'Yakin & Ajukan Pinjaman Ini'}
                            </button>
                        </div>
                        )}
                    </div>
                ) : activeTab === 'khusus' ? (
                    <div className="p-6">
                         <form onSubmit={handleAjukanPinjamanKhusus} className="space-y-4">
                             <div>
                                <label htmlFor="pokokKhusus" className="block text-sm font-medium text-gray-text">Jumlah Pinjaman (IDR)</label>
                                <input type="text" inputMode="numeric" id="pokokKhusus" value={new Intl.NumberFormat('id-ID').format(pokokPinjamanKhusus)} onChange={handleCurrencyChange(setPokokPinjamanKhusus)} className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 text-dark" required />
                            </div>
                             <div>
                                <label htmlFor="keterangan" className="block text-sm font-medium text-gray-text">Keterangan / Tujuan Pinjaman</label>
                                <textarea id="keterangan" value={keteranganKhusus} onChange={e => setKeteranganKhusus(e.target.value)} rows={3} className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 text-dark" required></textarea>
                            </div>
                             <div className="text-center pt-2">
                                 <button type="submit" disabled={isSubmitting} className="bg-secondary text-white py-2 px-6 rounded-lg font-semibold hover:bg-secondary-dark disabled:bg-zinc-700">
                                     {isSubmitting ? 'Mengirim...' : 'Ajukan Pinjaman Khusus'}
                                 </button>
                             </div>
                         </form>
                    </div>
                ) : ( // Pelunasan Tab
                     <div className="p-6">
                        <h3 className="text-lg font-bold text-dark mb-4">Simulasi Pelunasan Pinjaman Berjangka</h3>
                        {sisaPokokPinjaman > 0 ? (
                            <div className="space-y-4">
                                <div className="bg-zinc-800 p-4 rounded-lg">
                                    <InfoItem label="Sisa Pokok Pinjaman" value={formatCurrency(sisaPokokPinjaman)} />
                                    <InfoItem label={`Bunga Bulan Ini (${sukuBunga}%)`} value={formatCurrency(bungaBulanIni)} />
                                    <InfoItem 
                                        label="Total yang Harus Dibayar" 
                                        value={formatCurrency(totalPelunasan)}
                                        className="font-bold text-base md:text-lg bg-amber-500/10 text-amber-400 -mx-4 px-4"
                                    />
                                </div>
                                <p className="text-sm text-gray-text text-center italic">
                                    Ini adalah simulasi pelunasan untuk bulan ini. Hubungi admin untuk konfirmasi jumlah akhir dan proses pelunasan.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-text">
                                <p>Anda tidak memiliki pinjaman berjangka aktif untuk dilunasi.</p>
                            </div>
                        )}
                    </div>
                )}
                 {submitMessage.text && (
                    <p className={`pb-4 text-center text-sm font-semibold ${submitMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {submitMessage.text}
                    </p>
                )}
                {simulasi && activeTab === 'berjangka' && (
                    <div className="mt-8 border-t border-zinc-800 pt-6 px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                             <div>
                                <h3 className="font-bold text-base md:text-lg text-dark mb-2">Informasi Pinjaman Anda</h3>
                                <div className="bg-zinc-800 p-4 rounded-lg"><InfoItem label="Pokok Pinjaman" value={formatCurrency(simulasi.pokokPinjaman)} /><InfoItem label="Jangka Waktu" value={`${simulasi.jangkaWaktu} Bulan`} /><InfoItem label="Bunga per Bulan" value={`${simulasi.sukuBunga} %`} /><InfoItem label="Tanggal Mulai" value={formatDate(simulasi.tanggalMulai)} /></div>
                             </div>
                             <div>
                                <h3 className="font-bold text-base md:text-lg text-dark mb-2">Informasi Angsuran Anda</h3>
                                <div className="bg-zinc-800 p-4 rounded-lg">
                                    <InfoItem label="Metode" value={simulasi.metode_perhitungan} />
                                    {simulasi.metode_perhitungan === 'Plat Pokok' ? 
                                        <InfoItem label="Angsuran Pokok / Bulan" value={formatCurrency(simulasi.angsuranPokokBulan)} /> :
                                        <InfoItem label="Total Angsuran / Bulan" value={formatCurrency(simulasi.jadwal[0]?.totalAngsuran)} />
                                    }
                                    <InfoItem label="Total Bunga" value={formatCurrency(simulasi.totalBunga)} />
                                    <InfoItem label="Total yang Dibayarkan" value={formatCurrency(simulasi.totalBayar)} className="font-bold text-base md:text-lg bg-amber-500/10 text-amber-400 -mx-4 px-4" />
                                    <InfoItem label="Tanggal Lunas" value={formatDate(simulasi.tanggalLunas)} />
                                </div>
                             </div>
                        </div>
                        <div className="mt-8 overflow-x-auto">
                             <h3 className="font-bold text-base md:text-lg text-dark mb-4">Tabel Angsuran Kredit Anda (IDR)</h3>
                            <table className="w-full text-sm text-left text-gray-text">
                                <thead className="text-xs text-gray-text uppercase border-b border-zinc-800"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3 text-right">Angsuran Pokok</th><th className="px-4 py-3 text-right">Angsuran Bunga</th><th className="px-4 py-3 text-right">Total Angsuran/Bln</th><th className="px-4 py-3 text-right">Saldo Pinjaman</th></tr></thead>
                                <tbody>
                                    {simulasi.jadwal.map(row => (<tr key={row.bulan} className="hover:bg-zinc-800/50"><td className="px-4 py-3 font-medium text-dark">{row.bulan}</td><td className="px-4 py-3">{formatDate(row.tanggal)}</td><td className="px-4 py-3 text-right">{formatCurrency(row.angsuranPokok)}</td><td className="px-4 py-3 text-right">{formatCurrency(row.angsuranBunga)}</td><td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.totalAngsuran)}</td><td className="px-4 py-3 text-right font-bold text-dark">{formatCurrency(row.sisaPinjaman)}</td></tr>))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-8 bg-surface p-6 rounded-xl">
                 <h2 className="text-lg md:text-xl font-bold text-dark mb-4">Riwayat Pengajuan Pinjaman</h2>
                 <div className="overflow-x-auto">
                     {isLoading ? <p className="text-gray-text">Memuat riwayat...</p> : riwayat.length > 0 ? (
                         <table className="w-full text-sm text-left text-gray-text">
                            <thead className="text-xs text-gray-text uppercase border-b border-zinc-800">
                                <tr>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Jenis Pinjaman</th>
                                    <th className="px-4 py-3 text-right">Jumlah</th>
                                    <th className="px-4 py-3 text-center">Jangka Waktu</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                             <tbody>
                                 {riwayat.map(p => (
                                     <tr key={p.id} className="hover:bg-zinc-800/50">
                                         <td className="px-4 py-3">{formatDate(p.tanggal_pengajuan)}</td>
                                         <td className="px-4 py-3 font-medium text-dark">{p.jenis_pinjaman}</td>
                                         <td className="px-4 py-3 text-right">{formatCurrency(p.pokok_pinjaman)}</td>
                                         <td className="px-4 py-3 text-center">{p.jangka_waktu ? `${p.jangka_waktu} bulan` : '-'}</td>
                                         <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                                         <td className="px-4 py-3 text-center">
                                            {p.status === 'Menunggu Persetujuan' ? (
                                                <button
                                                    onClick={() => handleCancelPengajuan(p.id!)}
                                                    disabled={isCancelling === p.id}
                                                    className="text-red-400 hover:text-red-500 text-xs font-semibold disabled:text-zinc-600"
                                                >
                                                    {isCancelling === p.id ? 'Membatalkan...' : 'Batalkan'}
                                                </button>
                                            ) : (
                                                <span>-</span>
                                            )}
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : <p className="text-center text-gray-text py-6">Anda belum pernah mengajukan pinjaman.</p>}
                 </div>
            </div>
        </div>
    );
};

export default AnggotaPinjaman;