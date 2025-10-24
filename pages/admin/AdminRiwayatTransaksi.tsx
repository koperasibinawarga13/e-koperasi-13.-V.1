import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { TransaksiLog } from '../../types';
import { getLogs, getDistinctLogMonths } from '../../services/transaksiLogService';
import { PencilIcon, ClockIcon } from '../../components/icons/Icons';

const AdminRiwayatTransaksi: React.FC = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<TransaksiLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState<string>('all');
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [logsData, monthsData] = await Promise.all([
                getLogs(),
                getDistinctLogMonths()
            ]);
            setLogs(logsData);
            setAvailableMonths(monthsData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = log.nama_angota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  log.no_anggota.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesMonth = monthFilter === 'all' || log.periode === monthFilter;
            return matchesSearch && matchesMonth;
        });
    }, [logs, searchTerm, monthFilter]);

    const handleEdit = (logId: string) => {
        navigate(`/admin/transaksi?editLogId=${logId}`);
    };

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div>
            <Header title="Riwayat Transaksi" />
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <input
                        type="text"
                        placeholder="Cari (nama, no. anggota)..."
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/3 focus:ring-1 focus:ring-primary focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-auto focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                        <option value="all">Semua Bulan</option>
                        {availableMonths.map(month => (
                             <option key={month} value={month}>
                                {new Date(`${month}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                             </option>
                        ))}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <p className="text-center py-10">Memuat riwayat transaksi...</p> : (
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Tgl. Transaksi</th>
                                    <th className="px-4 py-3">Nama Anggota</th>
                                    <th className="px-4 py-3">No. Anggota</th>
                                    <th className="px-4 py-3">Periode</th>
                                    <th className="px-4 py-3 text-right">Total Setoran</th>
                                    <th className="px-4 py-3">Tipe</th>
                                    <th className="px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLogs.length > 0 ? filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-primary-light transition-colors">
                                        <td className="px-4 py-3">{log.tanggal_transaksi ? new Date(log.tanggal_transaksi).toLocaleDateString('id-ID') : '-'}</td>
                                        <td className="px-4 py-3 font-medium text-dark">{log.nama_angota}</td>
                                        <td className="px-4 py-3">{log.no_anggota}</td>
                                        <td className="px-4 py-3">{log.periode}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(log.Jumlah_setoran)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${log.type === 'EDIT' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => handleEdit(log.id)} className="text-blue-600 hover:text-blue-800" title="Edit Transaksi">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500">
                                            Tidak ada riwayat transaksi yang cocok dengan filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminRiwayatTransaksi;
