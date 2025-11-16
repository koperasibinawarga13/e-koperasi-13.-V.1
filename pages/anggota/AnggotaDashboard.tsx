import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { ChartBarIcon, CreditCardIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from '../../components/icons/Icons';
import { useAuth } from '../../context/AuthContext';
import { getAnggotaById } from '../../services/anggotaService';
import { getKeuanganByNoAnggota } from '../../services/keuanganService';
import { getLogsByAnggota } from '../../services/transaksiLogService';
import { Keuangan, TransaksiLog } from '../../types';


const AnggotaDashboard: React.FC = () => {
    const [keuangan, setKeuangan] = useState<Keuangan | null>(null);
    const [recentLogs, setRecentLogs] = useState<TransaksiLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (user?.anggotaId) {
                setIsLoading(true);
                try {
                    const anggota = await getAnggotaById(user.anggotaId);
                    if (anggota?.no_anggota) {
                        const [keuanganResult, logsResult] = await Promise.all([
                            getKeuanganByNoAnggota(anggota.no_anggota),
                            getLogsByAnggota(anggota.no_anggota)
                        ]);
                        setKeuangan(keuanganResult);
                        setRecentLogs(logsResult.slice(0, 5));
                    }
                } catch (error) {
                    console.error("Failed to fetch dashboard data:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };
    
    // Helper to summarize a transaction log for display
    const summarizeLog = (log: TransaksiLog) => {
        const setoran = log.Jumlah_setoran || 0;
        const penarikan = (log.transaksi_pengambilan_simpanan_pokok || 0) + (log.transaksi_pengambilan_simpanan_wajib || 0) + (log.transaksi_pengambilan_simpanan_sukarela || 0) + (log.transaksi_pengambilan_simpanan_wisata || 0);
        const pinjamanBaru = (log.transaksi_penambahan_pinjaman_berjangka || 0) + (log.transaksi_penambahan_pinjaman_khusus || 0) + (log.transaksi_penambahan_pinjaman_niaga || 0);

        if (setoran > penarikan && setoran > pinjamanBaru) {
            return { type: 'Setoran Bulanan', amount: setoran, icon: <ArrowUpRightIcon className="w-5 h-5" />, color: 'text-green-400', bgColor: 'bg-green-900/50' };
        }
        if (penarikan > setoran && penarikan > pinjamanBaru) {
            return { type: 'Penarikan Simpanan', amount: penarikan, icon: <ArrowDownLeftIcon className="w-5 h-5" />, color: 'text-amber-400', bgColor: 'bg-amber-900/50' };
        }
        if (pinjamanBaru > setoran && pinjamanBaru > penarikan) {
            return { type: 'Pencairan Pinjaman', amount: pinjamanBaru, icon: <ArrowDownLeftIcon className="w-5 h-5" />, color: 'text-red-400', bgColor: 'bg-red-900/50' };
        }
        if (setoran > 0) {
             return { type: 'Transaksi Bulanan', amount: setoran, icon: <ArrowUpRightIcon className="w-5 h-5" />, color: 'text-green-400', bgColor: 'bg-green-900/50' };
        }
        const totalOut = penarikan + pinjamanBaru;
        if (totalOut > 0) {
             return { type: 'Penarikan/Pinjaman', amount: totalOut, icon: <ArrowDownLeftIcon className="w-5 h-5" />, color: 'text-amber-400', bgColor: 'bg-amber-900/50' };
        }
        return null; // Don't show zero-value logs
    };

    const COLORS = ['#4338CA', '#10B981', '#F59E0B', '#EF4444'];
    
    const pieChartData = keuangan ? [
        { name: 'Simpanan Pokok', value: keuangan.akhir_simpanan_pokok || 0 },
        { name: 'Simpanan Wajib', value: keuangan.akhir_simpanan_wajib || 0 },
        { name: 'Simpanan Sukarela', value: keuangan.akhir_simpanan_sukarela || 0 },
        { name: 'Simpanan Wisata', value: keuangan.akhir_simpanan_wisata || 0 },
    ].filter(item => item.value > 0) : [];

    const totalSimpanan = keuangan?.jumlah_total_simpanan || 0;
    const totalPinjaman = keuangan?.jumlah_total_pinjaman || 0;
    const saldoAkhir = totalSimpanan - totalPinjaman;

    if (isLoading) {
        return (
            <div>
                <Header title="Dashboard" />
                <p className="text-center p-10 text-gray-400">Memuat data dashboard...</p>
            </div>
        );
    }
    
     if (!keuangan) {
        return (
             <div>
                <Header title="Dashboard" />
                <p className="text-center p-10 text-gray-400">Data keuangan tidak ditemukan. Silakan hubungi admin.</p>
            </div>
        );
    }

  return (
    <div>
      <Header title="Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Saldo Akhir" value={formatCurrency(saldoAkhir)} icon={<CreditCardIcon className="w-6 h-6" />} color="bg-blue-500" />
        <StatCard title="Total Simpanan" value={formatCurrency(totalSimpanan)} icon={<CreditCardIcon className="w-6 h-6" />} color="bg-green-500" />
        <StatCard title="Total Pinjaman" value={formatCurrency(totalPinjaman)} icon={<ChartBarIcon className="w-6 h-6" />} color="bg-yellow-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-surface p-6 rounded-xl border border-gray-700">
            <h2 className="text-lg md:text-xl font-bold text-dark mb-4">Rincian Simpanan</h2>
            <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                {pieChartData.length > 0 ? (
                    <PieChart>
                    <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} formatter={(value) => formatCurrency(value as number)} />
                    <Legend wrapperStyle={{ color: '#94a3b8' }}/>
                    </PieChart>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Tidak ada data simpanan untuk ditampilkan.
                    </div>
                )}
            </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-bold text-dark">Aktivitas Terbaru</h2>
                <Link to="/anggota/keuangan" className="text-sm font-semibold text-primary hover:underline">
                    Lihat Semua
                </Link>
            </div>
            <div className="space-y-4">
              {recentLogs.length > 0 ? recentLogs.map(log => {
                const summary = summarizeLog(log);
                if (!summary) return null;
                
                return (
                  <div key={log.id} className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${summary.bgColor} ${summary.color}`}>
                      {summary.icon}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-dark">{summary.type}</p>
                      <p className="text-sm text-gray-400">{new Date(log.log_time).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})}</p>
                    </div>
                    <div className={`font-semibold text-right ${summary.color}`}>
                      {summary.color.includes('green') ? '+' : '-'} {formatCurrency(summary.amount)}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Belum ada aktivitas terbaru.</p>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default AnggotaDashboard;