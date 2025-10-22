import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { getKeuanganByNoAnggota } from '../../services/keuanganService';
import { Keuangan, Anggota, PengajuanPinjaman } from '../../types';
import { getAnggotaById } from '../../services/anggotaService';
import { addPengajuanPinjaman, getPengajuanPinjamanByNoAnggota } from '../../services/pinjamanService';

interface SimulasiResult {
    pokokPinjaman: number;
    jangkaWaktu: number;
    sukuBunga: number;
    tanggalMulai: string;
    angsuranPokokBulan: number;
    totalBunga: number;
    totalBayar: number;
    tanggalLunas: string;
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
    const [jangkaWaktu, setJangkaWaktu] = useState(10);
    const [sukuBunga, setSukuBunga] = useState(2);
    const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
    const [simulasi, setSimulasi] = useState<SimulasiResult | null>(null);

    // State for Pinjaman Khusus
    const [pokokPinjamanKhusus, setPokokPinjamanKhusus] = useState(0);
    const [keteranganKhusus, setKeteranganKhusus] = useState('');
    
    // General State
    const [activeTab, setActiveTab] = useState<'berjangka' | 'khusus'>('berjangka');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: ''});


    useEffect(() => {
        const fetchData = async () => {
            if (user?.anggotaId) {
                setIsLoading(true);
                try {
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
                } catch (error) {
                    console.error("Failed to fetch loan data:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
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

        const angsuranPokokBulan = pokokPinjaman / jangkaWaktu;
        const bungaPerBulan = sukuBunga / 100;
        let sisaPinjaman = pokokPinjaman;
        let totalBunga = 0;
        const jadwal = [];
        const startDate = new Date(tanggalMulai);

        for (let i = 1; i <= jangkaWaktu; i++) {
            const angsuranBunga = sisaPinjaman * bungaPerBulan;
            totalBunga += angsuranBunga;
            
            const angsuranDate = new Date(startDate);
            angsuranDate.setMonth(startDate.getMonth() + i);

            jadwal.push({
                bulan: i,
                tanggal: angsuranDate.toISOString().split('T')[0],
                angsuranPokok: angsuranPokokBulan,
                angsuranBunga: angsuranBunga,
                totalAngsuran: angsuranPokokBulan + angsuranBunga,
                sisaPinjaman: sisaPinjaman - angsuranPokokBulan,
            });
            sisaPinjaman -= angsuranPokokBulan;
        }

        setSimulasi({pokokPinjaman, jangkaWaktu, sukuBunga, tanggalMulai, angsuranPokokBulan, totalBunga, totalBayar: pokokPinjaman + totalBunga, tanggalLunas: jadwal[jadwal.length - 1].tanggal, jadwal });
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
                jadwal_angsuran: simulasi.jadwal
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
    
    const InfoItem: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
        <div className={`flex justify-between items-center py-2 border-b ${className}`}>
            <span className="text-gray-600">{label}</span>
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
            case 'Menunggu Persetujuan': colorClasses = 'bg-amber-100 text-amber-800'; break;
            case 'Disetujui': colorClasses = 'bg-secondary-light text-secondary-dark'; break;
            case 'Ditolak': colorClasses = 'bg-red-100 text-red-800'; break;
        }
        return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
    };


    return (
        <div>
            <Header title="Pengajuan Pinjaman Anggota" />
            
            <div className="bg-white rounded-xl shadow-md mb-8">
                <h2 className="text-lg md:text-xl font-bold text-dark bg-gray-100 p-4 rounded-t-xl -m-0 mb-6">Sisa Pinjaman Anda</h2>
                 <div className="px-6 pb-6">
                    {isLoading ? <p>Memuat data sisa pinjaman...</p> : keuangan ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm text-yellow-800 font-medium">Sisa Pinjaman Berjangka</p>
                                <p className="text-xl md:text-2xl font-bold text-yellow-900">{formatCurrency(keuangan.akhir_pinjaman_berjangka)}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-orange-800 font-medium">Sisa Pinjaman Khusus</p>
                                <p className="text-xl md:text-2xl font-bold text-orange-900">{formatCurrency(keuangan.akhir_pinjaman_khusus)}</p>
                            </div>
                        </div>
                    ) : <p>Data pinjaman tidak ditemukan.</p>}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md">
                <h2 className="text-lg md:text-xl font-bold text-dark bg-gray-100 p-4 rounded-t-xl -m-0">Simulasi & Pengajuan Kredit</h2>
                 <nav className="flex border-b">
                    <button onClick={() => {setActiveTab('berjangka'); setSubmitMessage({type: '', text: ''})}} className={`py-3 px-6 font-semibold text-sm ${activeTab === 'berjangka' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}>Pinjaman Berjangka (Dengan Simulasi)</button>
                    <button onClick={() => {setActiveTab('khusus'); setSubmitMessage({type: '', text: ''})}} className={`py-3 px-6 font-semibold text-sm ${activeTab === 'khusus' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}>Pinjaman Khusus</button>
                 </nav>

                {activeTab === 'berjangka' ? (
                    <div className="p-6">
                        <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                            <div>
                                <label htmlFor="pokok" className="block text-sm font-medium text-gray-700">Pokok Pinjaman (IDR)</label>
                                <input type="text" inputMode="numeric" id="pokok" value={new Intl.NumberFormat('id-ID').format(pokokPinjaman)} onChange={handleCurrencyChange(setPokokPinjaman)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                            </div>
                             <div>
                                <label htmlFor="jangka" className="block text-sm font-medium text-gray-700">Jangka Waktu (Bulan)</label>
                                <input type="number" id="jangka" value={jangkaWaktu} onChange={e => setJangkaWaktu(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                             <div>
                                <label htmlFor="bunga" className="block text-sm font-medium text-gray-700">Bunga per Bulan (%)</label>
                                <input type="number" step="0.1" id="bunga" value={sukuBunga} onChange={e => setSukuBunga(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                            <div>
                                <button type="submit" className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark">Hitung Simulasi</button>
                            </div>
                             <div className="md:col-span-2 lg:col-span-4">
                                <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                                <input type="date" id="tanggal" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} className="mt-1 block w-full md:w-1/4 border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                            </div>
                        </form>
                        {simulasi && (
                        <div className="mt-8 text-center border-t pt-6">
                            <button onClick={handleAjukanPinjamanBerjangka} disabled={isSubmitting} className="bg-secondary text-white py-3 px-8 rounded-lg font-bold text-base md:text-lg hover:bg-secondary-dark disabled:bg-gray-400">
                                {isSubmitting ? 'Mengirim...' : 'Yakin & Ajukan Pinjaman Ini'}
                            </button>
                        </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6">
                         <form onSubmit={handleAjukanPinjamanKhusus} className="space-y-4">
                             <div>
                                <label htmlFor="pokokKhusus" className="block text-sm font-medium text-gray-700">Jumlah Pinjaman (IDR)</label>
                                <input type="text" inputMode="numeric" id="pokokKhusus" value={new Intl.NumberFormat('id-ID').format(pokokPinjamanKhusus)} onChange={handleCurrencyChange(setPokokPinjamanKhusus)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
                            </div>
                             <div>
                                <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700">Keterangan / Tujuan Pinjaman</label>
                                <textarea id="keterangan" value={keteranganKhusus} onChange={e => setKeteranganKhusus(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required></textarea>
                            </div>
                             <div className="text-center pt-2">
                                 <button type="submit" disabled={isSubmitting} className="bg-secondary text-white py-2 px-6 rounded-lg font-semibold hover:bg-secondary-dark disabled:bg-gray-400">
                                     {isSubmitting ? 'Mengirim...' : 'Ajukan Pinjaman Khusus'}
                                 </button>
                             </div>
                         </form>
                    </div>
                )}
                 {submitMessage.text && (
                    <p className={`pb-4 text-center text-sm font-semibold ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {submitMessage.text}
                    </p>
                )}
                {simulasi && activeTab === 'berjangka' && (
                    <div className="mt-8 border-t pt-6 px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                             <div>
                                <h3 className="font-bold text-base md:text-lg text-dark mb-2">Informasi Pinjaman Anda</h3>
                                <div className="bg-gray-50 p-4 rounded-lg"><InfoItem label="Pokok Pinjaman" value={formatCurrency(simulasi.pokokPinjaman)} /><InfoItem label="Jangka Waktu" value={`${simulasi.jangkaWaktu} Bulan`} /><InfoItem label="Bunga per Bulan" value={`${simulasi.sukuBunga} %`} /><InfoItem label="Tanggal Mulai" value={formatDate(simulasi.tanggalMulai)} /></div>
                             </div>
                             <div>
                                <h3 className="font-bold text-base md:text-lg text-dark mb-2">Informasi Angsuran Anda</h3>
                                <div className="bg-gray-50 p-4 rounded-lg"><InfoItem label="Angsuran Pokok / Bulan" value={formatCurrency(simulasi.angsuranPokokBulan)} /><InfoItem label="Total Bunga" value={formatCurrency(simulasi.totalBunga)} /><InfoItem label="Total yang Dibayarkan" value={formatCurrency(simulasi.totalBayar)} className="font-bold text-base md:text-lg bg-yellow-100 -mx-4 px-4" /><InfoItem label="Tanggal Lunas" value={formatDate(simulasi.tanggalLunas)} /></div>
                             </div>
                        </div>
                        <div className="mt-8 overflow-x-auto">
                             <h3 className="font-bold text-base md:text-lg text-dark mb-4">Tabel Angsuran Kredit Anda</h3>
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3 text-right">Angsuran Pokok</th><th className="px-4 py-3 text-right">Angsuran Bunga</th><th className="px-4 py-3 text-right">Total Angsuran</th><th className="px-4 py-3 text-right">Saldo Pinjaman</th></tr></thead>
                                <tbody>
                                    {simulasi.jadwal.map(row => (<tr key={row.bulan} className="bg-white border-b hover:bg-gray-50"><td className="px-4 py-3 font-medium">{row.bulan}</td><td className="px-4 py-3">{formatDate(row.tanggal)}</td><td className="px-4 py-3 text-right">{formatCurrency(row.angsuranPokok)}</td><td className="px-4 py-3 text-right">{formatCurrency(row.angsuranBunga)}</td><td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.totalAngsuran)}</td><td className="px-4 py-3 text-right font-bold text-dark">{formatCurrency(row.sisaPinjaman)}</td></tr>))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                 <h2 className="text-lg md:text-xl font-bold text-dark mb-4">Riwayat Pengajuan Pinjaman</h2>
                 <div className="overflow-x-auto">
                     {isLoading ? <p>Memuat riwayat...</p> : riwayat.length > 0 ? (
                         <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Jenis Pinjaman</th>
                                    <th className="px-4 py-3 text-right">Jumlah</th>
                                    <th className="px-4 py-3 text-center">Jangka Waktu</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                             <tbody>
                                 {riwayat.map(p => (
                                     <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                         <td className="px-4 py-3">{formatDate(p.tanggal_pengajuan)}</td>
                                         <td className="px-4 py-3 font-medium">{p.jenis_pinjaman}</td>
                                         <td className="px-4 py-3 text-right">{formatCurrency(p.pokok_pinjaman)}</td>
                                         <td className="px-4 py-3 text-center">{p.jangka_waktu ? `${p.jangka_waktu} bulan` : '-'}</td>
                                         <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : <p className="text-center text-gray-500 py-6">Anda belum pernah mengajukan pinjaman.</p>}
                 </div>
            </div>
        </div>
    );
};

export default AnggotaPinjaman;