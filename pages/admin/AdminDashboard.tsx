import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { UsersIcon, ChartBarIcon, CreditCardIcon, BuildingOfficeIcon } from '../../components/icons/Icons';
import { getAnggota } from '../../services/anggotaService';
import { getKeuangan } from '../../services/keuanganService';
import { Keuangan } from '../../types';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalAnggota: 0,
        totalSimpanan: 0,
        totalPinjaman: 0,
        saldoKas: 0,
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [anggotaData, keuanganData] = await Promise.all([getAnggota(), getKeuangan()]);

                const totalSimpanan = keuanganData.reduce((acc, curr) => acc + (curr.jumlah_total_simpanan || 0), 0);
                const totalPinjaman = keuanganData.reduce((acc, curr) => acc + (curr.jumlah_total_pinjaman || 0), 0);
                
                setStats({
                    totalAnggota: anggotaData.length,
                    totalSimpanan,
                    totalPinjaman,
                    saldoKas: totalSimpanan - totalPinjaman,
                });

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
                <StatCard title="Total Anggota" value={stats.totalAnggota.toLocaleString('id-ID')} icon={<UsersIcon className="w-8 h-8 text-white" />} color="bg-blue-500" />
                <StatCard title="Total Simpanan" value={formatCurrency(stats.totalSimpanan)} icon={<CreditCardIcon className="w-8 h-8 text-white" />} color="bg-green-500" />
                <StatCard title="Total Pinjaman" value={formatCurrency(stats.totalPinjaman)} icon={<ChartBarIcon className="w-8 h-8 text-white" />} color="bg-yellow-500" />
                <StatCard title="Saldo Kas" value={formatCurrency(stats.saldoKas)} icon={<BuildingOfficeIcon className="w-8 h-8 text-white" />} color="bg-red-500" />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-dark mb-4">Ringkasan Saldo Akhir</h2>
                 {chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} />
                                <YAxis tickFormatter={(tick) => `${(tick / 1000000).toLocaleString('id-ID')} Jt`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="total" name="Total Saldo Akhir" fill="#1E40AF" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 ) : (
                    <p className="text-center text-gray-500 py-10">Data tidak tersedia untuk menampilkan grafik.</p>
                 )}
            </div>
        </div>
    );
};

export default AdminDashboard;