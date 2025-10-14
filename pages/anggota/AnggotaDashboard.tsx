
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { UsersIcon, ChartBarIcon, CreditCardIcon } from '../../components/icons/Icons';

const data = [
  { name: 'Simpanan Pokok', value: 5000000 },
  { name: 'Simpanan Wajib', value: 8500000 },
  { name: 'Simpanan Sukarela', value: 1500000 },
];
const COLORS = ['#1E40AF', '#10B981', '#F59E0B'];

const AnggotaDashboard: React.FC = () => {
  return (
    <div>
      <Header title="Dashboard Anggota" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Saldo Akhir" value="Rp 15.000.000" icon={<CreditCardIcon className="w-8 h-8 text-white" />} color="bg-blue-500" />
        <StatCard title="Total Simpanan" value="Rp 15.000.000" icon={<UsersIcon className="w-8 h-8 text-white" />} color="bg-green-500" />
        <StatCard title="Total Pinjaman" value="Rp 5.000.000" icon={<ChartBarIcon className="w-8 h-8 text-white" />} color="bg-yellow-500" />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-dark mb-4">Rincian Simpanan</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR'}).format(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnggotaDashboard;
