import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { UsersIcon, ChartBarIcon, CreditCardIcon, BuildingOfficeIcon, CheckIcon, XMarkIcon } from '../../components/icons/Icons';
import { getAnggota } from '../../services/anggotaService';
import { getKeuangan } from '../../services/keuanganService';
import { getPengajuanPinjamanByStatus, updatePengajuanStatus } from '../../services/pinjamanService';
import { Keuangan, PengajuanPinjaman } from '../../types';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalAnggota: 0,
        totalSimpanan: 0,
        totalPinjaman: 0,
        saldoKas: 0,
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingLoans, setPendingLoans] = useState<PengajuanPinjaman[]>([]);
    const [isUpdatingLoan, setIsUpdatingLoan] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [anggotaData, keuanganData, pendingLoansData] = await Promise.all([
                    getAnggota(),
                    getKeuangan(),
                    getPengajuanPinjamanByStatus('Menunggu Persetujuan')
                ]);

                const totalSimpanan = keuanganData.reduce((acc, curr) => acc + (curr.jumlah_total_simpanan || 0), 0);
                const totalPinjaman = keuanganData.reduce((acc, curr) => acc + (curr.jumlah_total_pinjaman || 0), 0);
                
                setStats({
                    totalAnggota: anggotaData.length,
                    totalSimpanan,
                    totalPinjaman,
                    saldoKas: totalSimpanan - totalPinjaman,
                });

                setPendingLoans(pendingLoansData);

                // Prepare data for the chart: Aggregate final balances
                const finalBalanceTotals = keuanganData.reduce((acc, curr) => {
                    acc.wajib += curr.akhir_simpanan_wajib || 0;
                    acc.sukarela += curr.akhir_simpanan_sukarela || 0;
                    acc.wisata += curr.akhir_simpanan_wisata || 0;
                    acc.pinjamanBerjangka += curr.akhir_pinjaman_berjangka || 0;
                    acc.pinjamanKhusus += curr.akhir_pinjaman_khusus || 0;
                    return acc;
                }, {
                    wajib: 0,
                    sukarela: 0,
                    wisata: 0,
                    pinjamanBerjangka: 0,
                    pinjamanKhusus: 0,
                });

                const aggregatedChartData = [
                    { name: 'Simpanan Wajib', total: finalBalanceTotals.wajib },
                    { name: 'Simpanan Sukarela', total: finalBalanceTotals.sukarela },
                    { name: 'Simpanan Wisata', total: finalBalanceTotals.wisata },
                    { name: 'Pinjaman Berjangka', total: finalBalanceTotals.pinjamanBerjangka },
                    { name: 'Pinjaman Khusus', total: finalBalanceTotals.pinjamanKhusus },
                ];
                
                setChartData(aggregatedChartData);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const handleLoanAction = async (id: string, action: 'Disetujui' | 'Ditolak') => {
        if (!window.confirm(`Apakah Anda yakin ingin ${action === 'Disetujui' ? 'menyetujui' : 'menolak'} pengajuan ini?`)) {
            return;
        }
        
        setIsUpdatingLoan(id);
        try {
            await updatePengajuanStatus(id, action);
            setPendingLoans(prevLoans => prevLoans.filter(loan => loan.id !== id));
        } catch (error) {
            console.error(`Failed to ${action} loan:`, error);
            alert(`Gagal memperbarui status pengajuan. Silakan coba lagi.`);
        } finally {
            setIsUpdatingLoan(null);
        }
    };

    if (isLoading) {
        return (
             <div>
                <Header title="Dashboard Admin" />
                <div className="text-center p-10">Memuat data dashboard...</div>
            </div>
        )
    }

    return (
        <div>
            <Header title="Dashboard Admin" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Anggota" value={stats.totalAnggota.toLocaleString('id-ID')} icon={<UsersIcon className="w-6 h-6" />} color="bg-gradient-to-br from-indigo-500 to-blue-600" />
                <StatCard title="Total Simpanan" value={formatCurrency(stats.totalSimpanan)} icon={<CreditCardIcon className="w-6 h-6" />} color="bg-gradient-to-br from-emerald-500 to-green-600" />
                <StatCard title="Total Pinjaman" value={formatCurrency(stats.totalPinjaman)} icon={<ChartBarIcon className="w-6 h-6" />} color="bg-gradient-to-br from-amber-400 to-yellow-500" />
                <StatCard title="Saldo Kas" value={formatCurrency(stats.saldoKas)} icon={<BuildingOfficeIcon className="w-6 h-6" />} color="bg-gradient-to-br from-rose-400 to-red-500" />
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg md:text-xl font-bold text-dark mb-4">Ringkasan Saldo Akhir</h2>
                 {chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} />
                                <YAxis tickFormatter={(tick) => `${(tick / 1000000).toLocaleString('id-ID')} Jt`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="total" name="Total Saldo Akhir" fill="#4338CA" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 ) : (
                    <p className="text-center text-gray-500 py-10">Data tidak tersedia untuk menampilkan grafik.</p>
                 )}
            </div>

             <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg md:text-xl font-bold text-dark mb-4">Pengajuan Pinjaman Baru</h2>
                {pendingLoans.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-4 font-semibold border-b-2 border-gray-200">Nama Anggota</th>
                                    <th className="px-4 py-4 font-semibold border-b-2 border-gray-200">Jenis</th>
                                    <th className="px-4 py-4 font-semibold border-b-2 border-gray-200">Tanggal</th>
                                    <th className="px-4 py-4 font-semibold border-b-2 border-gray-200 text-right">Jumlah Pinjaman</th>
                                    <th className="px-4 py-4 font-semibold border-b-2 border-gray-200 text-center">Jangka Waktu</th>
                                    <th className="px-4 py-4 font-semibold border-b-2 border-gray-200 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingLoans.map(loan => (
                                    <tr key={loan.id} className="hover:bg-primary-light transition-colors">
                                        <td className="px-4 py-4 font-medium text-dark">{loan.nama_anggota}</td>
                                        <td className="px-4 py-4 font-semibold">{loan.jenis_pinjaman}</td>
                                        <td className="px-4 py-4">{new Date(loan.tanggal_pengajuan).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-4 text-right">{formatCurrency(loan.pokok_pinjaman)}</td>
                                        <td className="px-4 py-4 text-center">{loan.jangka_waktu ? `${loan.jangka_waktu} bulan` : '-'}</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleLoanAction(loan.id, 'Disetujui')}
                                                    disabled={isUpdatingLoan === loan.id}
                                                    className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50"
                                                    title="Setujui"
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleLoanAction(loan.id, 'Ditolak')}
                                                    disabled={isUpdatingLoan === loan.id}
                                                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
                                                    title="Tolak"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-6">Tidak ada pengajuan pinjaman baru.</p>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;