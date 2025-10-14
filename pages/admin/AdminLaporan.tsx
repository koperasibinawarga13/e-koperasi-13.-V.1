
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';

const data = [
  { name: 'Jan', pemasukan: 40000000, pengeluaran: 24000000 },
  { name: 'Feb', pemasukan: 30000000, pengeluaran: 13980000 },
  { name: 'Mar', pemasukan: 20000000, pengeluaran: 9800000 },
  { name: 'Apr', pemasukan: 27800000, pengeluaran: 3908000 },
  { name: 'Mei', pemasukan: 18900000, pengeluaran: 4800000 },
  { name: 'Jun', pemasukan: 23900000, pengeluaran: 3800000 },
];

const AdminLaporan: React.FC = () => {
  return (
    <div>
      <Header title="Laporan Keuangan" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-dark">Ringkasan Keuangan</h2>
            <div className="flex items-center gap-4">
                <select className="border border-gray-300 rounded-lg px-3 py-2">
                    <option>Juni 2024</option>
                    <option>Mei 2024</option>
                    <option>April 2024</option>
                </select>
                <button className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                    Ekspor PDF
                </button>
                <button className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors">
                    Ekspor Excel
                </button>
            </div>
        </div>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} />
                    <Tooltip formatter={(value) => new Intl.NumberFormat('id-ID').format(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="pemasukan" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="pengeluaran" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminLaporan;
