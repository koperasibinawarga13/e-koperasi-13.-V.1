
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { UsersIcon, ChartBarIcon, CreditCardIcon, UploadIcon } from '../../components/icons/Icons';

const data = [
  { name: 'Jan', simpanan: 4000, pinjaman: 2400 },
  { name: 'Feb', simpanan: 3000, pinjaman: 1398 },
  { name: 'Mar', simpanan: 2000, pinjaman: 9800 },
  { name: 'Apr', simpanan: 2780, pinjaman: 3908 },
  { name: 'Mei', simpanan: 1890, pinjaman: 4800 },
  { name: 'Jun', simpanan: 2390, pinjaman: 3800 },
];

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <Header title="Dashboard Admin" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Anggota" value="1,250" icon={<UsersIcon className="w-8 h-8 text-white" />} color="bg-blue-500" />
        <StatCard title="Total Simpanan" value="Rp 2.1 M" icon={<CreditCardIcon className="w-8 h-8 text-white" />} color="bg-green-500" />
        <StatCard title="Total Pinjaman" value="Rp 850 Jt" icon={<ChartBarIcon className="w-8 h-8 text-white" />} color="bg-yellow-500" />
        <StatCard title="Saldo Kas" value="Rp 1.25 M" icon={<UploadIcon className="w-8 h-8 text-white" />} color="bg-red-500" />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-dark mb-4">Perbandingan Simpanan & Pinjaman (6 Bulan Terakhir)</h2>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="simpanan" fill="#10B981" />
                    <Bar dataKey="pinjaman" fill="#F59E0B" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
