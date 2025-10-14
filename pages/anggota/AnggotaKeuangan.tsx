
import React from 'react';
import Header from '../../components/Header';
import { Transaction } from '../../types';

const mockTransactions: Transaction[] = [
    { id: '1', date: '2024-06-05', description: 'Angsuran Pinjaman', type: 'Angsuran', amount: 500000, balance: 14500000 },
    { id: '2', date: '2024-06-01', description: 'Simpanan Wajib', type: 'Simpanan', amount: 100000, balance: 15000000 },
    { id: '3', date: '2024-05-15', description: 'Penarikan Tunai', type: 'Penarikan', amount: -200000, balance: 14900000 },
    { id: '4', date: '2024-05-05', description: 'Angsuran Pinjaman', type: 'Angsuran', amount: 500000, balance: 15100000 },
    { id: '5', date: '2024-05-01', description: 'Simpanan Wajib', type: 'Simpanan', amount: 100000, balance: 14600000 },
];

const AnggotaKeuangan: React.FC = () => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const getAmountColor = (type: Transaction['type']) => {
        switch (type) {
            case 'Simpanan':
            case 'Angsuran':
                return 'text-green-600';
            case 'Penarikan':
            case 'Pinjaman':
                return 'text-red-600';
            default:
                return 'text-gray-900';
        }
    };

  return (
    <div>
      <Header title="Rincian Keuangan" />
       <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
                <label>Pilih Bulan:</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2">
                    <option>Juni 2024</option>
                    <option>Mei 2024</option>
                    <option>April 2024</option>
                </select>
            </div>
            <button className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors">
                Download Slip
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Tanggal</th>
                <th scope="col" className="px-6 py-3">Keterangan</th>
                <th scope="col" className="px-6 py-3">Jenis Transaksi</th>
                <th scope="col" className="px-6 py-3 text-right">Jumlah</th>
                <th scope="col" className="px-6 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((tx) => (
                <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{tx.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{tx.description}</td>
                  <td className="px-6 py-4">{tx.type}</td>
                  <td className={`px-6 py-4 text-right font-semibold ${getAmountColor(tx.type)}`}>{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(tx.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnggotaKeuangan;
