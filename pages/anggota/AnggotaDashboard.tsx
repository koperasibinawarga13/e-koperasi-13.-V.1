import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { ChartBarIcon, CreditCardIcon } from '../../components/icons/Icons';
import { useAuth } from '../../context/AuthContext';
import { getAnggotaById } from '../../services/anggotaService';
import { getKeuanganByNoAnggota } from '../../services/keuanganService';
import { Keuangan } from '../../types';


const AnggotaDashboard: React.FC = () => {
    const [keuangan, setKeuangan] = useState<Keuangan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (user?.anggotaId) {
                setIsLoading(true);
                try {
                    const anggota = await getAnggotaById(user.anggotaId);
                    if (anggota?.no_anggota) {
                        const result = await getKeuanganByNoAnggota(anggota.no_anggota);
                        setKeuangan(result);
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

    const COLORS = ['#0052FF', '#10B981', '#F59E0B', '#EF4444'];
    
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
                <p className="text-center p-10">Memuat data dashboard...</p>
            </div>
        );
    }
    
     if (!keuangan) {
        return (
             <div>
                <Header title="Dashboard" />
                <p className="text-center p-10">Data keuangan tidak ditemukan. Silakan hubungi admin.</p>
            </div>
        );
    }

  return (
    <div>
      <Header title="Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Saldo Akhir" value={formatCurrency(saldoAkhir)} icon={<CreditCardIcon className="w-6 h-6 text-white" />} color="bg-blue-500" />
        <StatCard title="Total Simpanan" value={formatCurrency(totalSimpanan)} icon={<CreditCardIcon className="w-6 h-6 text-white" />} color="bg-green-500" />
        <StatCard title="Total Pinjaman" value={formatCurrency(totalPinjaman)} icon={<ChartBarIcon className="w-6 h-6 text-white" />} color="bg-yellow-500" />
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-dark mb-4">Rincian Simpanan</h2>
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
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Tidak ada data simpanan untuk ditampilkan.
                </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnggotaDashboard;