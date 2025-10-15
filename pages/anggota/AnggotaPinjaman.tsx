import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { getKeuanganByNoAnggota } from '../../services/keuanganService';
import { Keuangan, Anggota } from '../../types';
import { getAnggotaById } from '../../services/anggotaService';
import { addPengajuanPinjaman } from '../../services/pinjamanService';

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
    
    // State for simulator
    const [pokokPinjaman, setPokokPinjaman] = useState(10000000);
    const [jangkaWaktu, setJangkaWaktu] = useState(10);
    const [sukuBunga, setSukuBunga] = useState(2);
    const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
    const [simulasi, setSimulasi] = useState<SimulasiResult | null>(null);

    // State for submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');


    useEffect(() => {
        const fetchData = async () => {
            if (user?.anggotaId) {
                setIsLoading(true);
                try {
                    const anggotaData = await getAnggotaById(user.anggotaId);
                    setAnggota(anggotaData);
                    if (anggotaData?.no_anggota) {
                        const result = await getKeuanganByNoAnggota(anggotaData.no_anggota);
                        setKeuangan(result);
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
    }, [user]);

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        // add time zone offset to prevent date from shifting
        const offset = date.getTimezoneOffset();
        const correctedDate = new Date(date.getTime() + (offset*60*1000));
        return correctedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitMessage(''); // Clear previous submission message
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

        const tanggalLunas = jadwal[jadwal.length - 1].tanggal;

        setSimulasi({
            pokokPinjaman,
            jangkaWaktu,
            sukuBunga,
            tanggalMulai,
            angsuranPokokBulan,
            totalBunga,
            totalBayar: pokokPinjaman + totalBunga,
            tanggalLunas,
            jadwal,
        });
    };
    
    const handleAjukanPinjaman = async () => {
        if (!simulasi || !anggota) {
            alert("Silakan hitung simulasi terlebih dahulu.");
            return;
        }
        
        setIsSubmitting(true);
        setSubmitMessage('');

        try {
            await addPengajuanPinjaman({
                no_anggota: anggota.no_anggota,
                nama_anggota: anggota.nama,
                pokok_pinjaman: simulasi.pokokPinjaman,
                jangka_waktu: simulasi.jangkaWaktu,
                bunga_per_bulan: simulasi.sukuBunga,
                angsuran_pokok_bulan: simulasi.angsuranPokokBulan,
                total_bunga: simulasi.totalBunga,
                total_bayar: simulasi.totalBayar,
                jadwal_angsuran: simulasi.jadwal
            });
            setSubmitMessage('Pengajuan pinjaman Anda berhasil dikirim dan akan segera ditinjau oleh admin.');
        } catch (error) {
            setSubmitMessage('Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const InfoItem: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
        <div className={`flex justify-between items-center py-2 border-b ${className}`}>
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold text-dark">{value}</span>
        </div>
    );

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
        setPokokPinjaman(isNaN(numericValue) ? 0 : numericValue);
    };

    return (
        <div>
            <Header title="Pengajuan Pinjaman Anggota" />
            
            <div className="bg-white rounded-xl shadow-md mb-8">
                <h2 className="text-xl font-bold text-dark bg-gray-100 p-4 rounded-t-xl -m-0 mb-6">Sisa Pinjaman Anda</h2>
                 <div className="px-6 pb-6">
                    {isLoading ? (
                        <p>Memuat data sisa pinjaman...</p>
                    ) : keuangan ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm text-yellow-800 font-medium">Sisa Pinjaman Berjangka</p>
                                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(keuangan.akhir_pinjaman_berjangka)}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-orange-800 font-medium">Sisa Pinjaman Khusus</p>
                                <p className="text-2xl font-bold text-orange-900">{formatCurrency(keuangan.akhir_pinjaman_khusus)}</p>
                            </div>
                        </div>
                    ) : (
                        <p>Data pinjaman tidak ditemukan.</p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-dark bg-gray-100 p-4 rounded-t-xl -m-0 mb-6">Simulasi & Pengajuan Kredit</h2>
                <div className="px-6 pb-6">
                    <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div>
                            <label htmlFor="pokok" className="block text-sm font-medium text-gray-700">Pokok Pinjaman (IDR)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                id="pokok"
                                value={new Intl.NumberFormat('id-ID').format(pokokPinjaman)}
                                onChange={handleCurrencyChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                         <div>
                            <label htmlFor="jangka" className="block text-sm font-medium text-gray-700">Jangka Waktu (Bulan)</label>
                            <input type="number" id="jangka" value={jangkaWaktu} onChange={e => setJangkaWaktu(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                         <div>
                            <label htmlFor="bunga" className="block text-sm font-medium text-gray-700">Bunga per Bulan (%)</label>
                            <input type="number" step="0.1" id="bunga" value={sukuBunga} onChange={e => setSukuBunga(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <button type="submit" className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors">Hitung Simulasi</button>
                        </div>
                         <div className="md:col-span-2 lg:col-span-4">
                            <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                            <input type="date" id="tanggal" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} className="mt-1 block w-full md:w-1/4 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                    </form>

                     {simulasi && (
                        <div className="mt-8 text-center border-t pt-6">
                            <button
                                onClick={handleAjukanPinjaman}
                                disabled={isSubmitting}
                                className="bg-secondary text-white py-3 px-8 rounded-lg font-bold text-lg hover:bg-emerald-600 transition-colors disabled:bg-gray-400"
                            >
                                {isSubmitting ? 'Mengirim...' : 'Yakin & Ajukan Pinjaman Ini'}
                            </button>
                            {submitMessage && (
                                <p className={`mt-4 text-sm font-semibold ${submitMessage.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>
                                    {submitMessage}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {simulasi && (
                    <div className="mt-8 border-t pt-6 px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                             <div>
                                <h3 className="font-bold text-lg text-dark mb-2">Informasi Pinjaman Anda</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <InfoItem label="Pokok Pinjaman" value={formatCurrency(simulasi.pokokPinjaman)} />
                                    <InfoItem label="Jangka Waktu" value={`${simulasi.jangkaWaktu} Bulan`} />
                                    <InfoItem label="Bunga per Bulan" value={`${simulasi.sukuBunga} %`} />
                                    <InfoItem label="Tanggal Mulai" value={formatDate(simulasi.tanggalMulai)} />
                                </div>
                             </div>
                             <div>
                                <h3 className="font-bold text-lg text-dark mb-2">Informasi Angsuran Anda</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <InfoItem label="Angsuran Pokok / Bulan" value={formatCurrency(simulasi.angsuranPokokBulan)} />
                                    <InfoItem label="Total Bunga" value={formatCurrency(simulasi.totalBunga)} />
                                    <InfoItem label="Total yang Dibayarkan" value={formatCurrency(simulasi.totalBayar)} className="font-bold text-lg bg-yellow-100 -mx-4 px-4" />
                                    <InfoItem label="Tanggal Lunas" value={formatDate(simulasi.tanggalLunas)} />
                                </div>
                             </div>
                        </div>

                        <div className="mt-8 overflow-x-auto">
                             <h3 className="font-bold text-lg text-dark mb-4">Tabel Angsuran Kredit Anda</h3>
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Tanggal</th>
                                        <th className="px-4 py-3 text-right">Angsuran Pokok</th>
                                        <th className="px-4 py-3 text-right">Angsuran Bunga</th>
                                        <th className="px-4 py-3 text-right">Total Angsuran</th>
                                        <th className="px-4 py-3 text-right">Saldo Pinjaman</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {simulasi.jadwal.map(row => (
                                        <tr key={row.bulan} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{row.bulan}</td>
                                            <td className="px-4 py-3">{formatDate(row.tanggal)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.angsuranPokok)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.angsuranBunga)}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.totalAngsuran)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-dark">{formatCurrency(row.sisaPinjaman)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnggotaPinjaman;