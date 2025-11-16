import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { ChartBarIcon, CreditCardIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from '../../components/icons/Icons';
import { useAuth } from '../../context/AuthContext';
import { getAnggotaById } from '../../services/anggotaService';
import { getKeuanganByNoAnggota, getHistoryByAnggota } from '../../services/keuanganService';
import { getLogsByAnggota } from '../../services/transaksiLogService';
import { Keuangan, TransaksiLog } from '../../types';


const AnggotaDashboard: React.FC = () => {
    const [keuangan, setKeuangan] = useState<Keuangan | null>(null);
    const [recentLogs, setRecentLogs] = useState<TransaksiLog[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (user?.anggotaId) {
                setIsLoading(true);
                try {
                    const anggota = await getAnggotaById(user.anggotaId);
                    if (anggota?.no_anggota) {
                        const [keuanganResult, logsResult, historyResult] = await Promise.all([
                            getKeuanganByNoAnggota(anggota.no_anggota),
                            getLogsByAnggota(anggota.no_anggota),
                            getHistoryByAnggota(anggota.no_anggota)
                        ]);
                        setKeuangan(keuanganResult);
                        setRecentLogs(logsResult.slice(0, 5));

                        // Prepare data for LineChart with both savings and loans
                        const formattedHistory = historyResult
                            .map(item => ({
                                date: new Date(`${item.periode}-02`).toLocaleDateString('id-ID', { month: 'short', year: '2-digit'}),
                                Simpanan: item.jumlah_total_simpanan || 0,
                                Pinjaman: item.jumlah_total_pinjaman || 0,
                            }))
                            .reverse(); // oldest to newest
                        setChartData(formattedHistory);
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
            return { type: 'Setoran Bulanan', amount: setoran, icon: <ArrowUpRightIcon className="w-5 h-5" />, color: 'text-primary', bgColor: 'bg-primary-light' };
        }
        if (penarikan > setoran && penarikan > pinjamanBaru) {
            return { type: 'Penarikan Simpanan', amount: penarikan, icon: <ArrowDownLeftIcon className="w-5 h-5" />, color: 'text-accent', bgColor: 'bg-accent/10' };
        }
        if (pinjamanBaru > setoran && pinjamanBaru > penarikan) {
            return { type: 'Pencairan Pinjaman', amount: pinjamanBaru, icon: <ArrowDownLeftIcon className="w-5 h-5" />, color: 'text-red-400', bgColor: 'bg-red-500/10' };
        }
        if (setoran > 0) {
             return { type: 'Transaksi Bulanan', amount: setoran, icon: <ArrowUpRightIcon className="w-5 h-5" />, color: 'text-primary', bgColor: 'bg-primary-light' };
        }
        const totalOut = penarikan + pinjamanBaru;
        if (totalOut > 0) {
             return { type: 'Penarikan/Pinjaman', amount: totalOut, icon: <ArrowDownLeftIcon className="w-5 h-5" />, color: 'text-accent', bgColor: 'bg-accent/10' };
        }
        return null; // Don't show zero-value logs
    };

    const totalSimpanan = keuangan?.jumlah_total_simpanan || 0;
    const totalPinjaman = keuangan?.jumlah_total_pinjaman || 0;
    const saldoAkhir = totalSimpanan - totalPinjaman;

    if (isLoading) {
        return (
            <div>
                <Header title="Dashboard" />
                <p className="text-center p-10 text-gray-text">Memuat data dashboard...</p>
            </div>
        );
    }
    
     if (!keuangan) {
        return (
             <div>
                <Header title="Dashboard" />
                <p className="text-center p-10 text-gray-text">Data keuangan tidak ditemukan. Silakan hubungi admin.</p>
            </div>
        );
    }

  return (
    <div>
      <Header title="Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Saldo Akhir" value={formatCurrency(saldoAkhir)} icon={<CreditCardIcon className="w-6 h-6" />} iconBgColor="bg-primary" />
        <StatCard title="Total Simpanan" value={formatCurrency(totalSimpanan)} icon={<CreditCardIcon className="w-6 h-6" />} iconBgColor="bg-secondary" />
        <StatCard title="Total Pinjaman" value={formatCurrency(totalPinjaman)} icon={<ChartBarIcon className="w-6 h-6" />} iconBgColor="bg-accent" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-surface p-6 rounded-xl">
            <h2 className="text-lg md:text-xl font-bold text-dark mb-4">Riwayat Simpanan & Pinjaman</h2>
            <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" tick={{ fill: '#a1a1aa' }} />
                <YAxis tickFormatter={(tick) => `${(tick / 1000000).toLocaleString('id-ID')} Jt`} tick={{ fill: '#a1a1aa' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#ffffff' }} 
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Legend wrapperStyle={{ color: '#a1a1aa', paddingTop: '20px' }}/>
                <Line type="monotone" dataKey="Simpanan" stroke="#a3e635" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Pinjaman" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-surface p-6 rounded-xl">
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
                      <p className="text-sm text-gray-text">{new Date(log.log_time).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})}</p>
                    </div>
                    <div className={`font-semibold text-right ${summary.color}`}>
                      {summary.color.includes('primary') ? '+' : '-'} {formatCurrency(summary.amount)}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-text">
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