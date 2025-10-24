import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { TransaksiLog } from '../../types';
import { getLogsByAnggota, synchronizeMissingLogs } from '../../services/transaksiLogService';
import { PencilIcon } from '../../components/icons/Icons';
import { useAuth } from '../../context/AuthContext';

const AdminRiwayatTransaksi: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResult, setSearchResult] = useState<TransaksiLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedLog, setSelectedLog] = useState<TransaksiLog | null>(null);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;

        setIsLoading(true);
        setSearched(true);
        const data = await getLogsByAnggota(searchTerm.toUpperCase());
        setSearchResult(data);
        setIsLoading(false);
    };
    
    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const { created } = await synchronizeMissingLogs();
            if (created > 0) {
                setSyncMessage(`Sinkronisasi berhasil! ${created} riwayat transaksi yang hilang berhasil dibuat.`);
                // Refresh search if a member is already being viewed
                if (searched && searchTerm) {
                    handleSearch(new Event('submit') as any);
                }
            } else {
                setSyncMessage('Tidak ada riwayat transaksi yang hilang. Data Anda sudah sinkron.');
            }
        } catch (error) {
            console.error(error);
            setSyncMessage('Terjadi kesalahan saat sinkronisasi.');
        } finally {
            setIsSyncing(false);
        }
    };

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const LogDetailModal: React.FC<{ log: TransaksiLog; onClose: () => void }> = ({ log, onClose }) => {
        const detailItems = Object.entries(log)
            .filter(([key, value]) => typeof value === 'number' && value > 0 && key !== 'no')
            .map(([key, value]) => ({
                label: key.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, l => l.toUpperCase()),
                value: formatCurrency(value as number)
            }));

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="text-lg font-semibold text-dark">Detail Transaksi Log</h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <div>
                    <div className="space-y-2 text-sm">
                        {detailItems.map(item => (
                            <div key={item.label} className="flex justify-between">
                                <span className="text-gray-600">{item.label}:</span>
                                <span className="font-semibold text-dark">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            </div>
        );
    };

    return (
        <div>
            <Header title="Riwayat Transaksi Manual" />
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6">
                    <form onSubmit={handleSearch} className="flex gap-4 flex-grow">
                        <input
                            type="text"
                            placeholder="Masukkan Nomor Anggota (e.g., AK-101)"
                            className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" disabled={isLoading} className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-400">
                            {isLoading ? 'Mencari...' : 'Cari'}
                        </button>
                    </form>
                    <div className="flex-shrink-0">
                        <button 
                            onClick={handleSync} 
                            disabled={isSyncing} 
                            className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary-dark disabled:bg-gray-400"
                            title="Pindai dan buat log untuk transaksi manual yang tidak tercatat di riwayat."
                        >
                            {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Riwayat'}
                        </button>
                    </div>
                </div>
                
                {syncMessage && (
                    <div className="mb-4 p-3 rounded-md text-sm bg-blue-100 text-blue-800 text-center">
                        {syncMessage}
                    </div>
                )}


                <div className="overflow-x-auto">
                    {isLoading ? <p className="text-center py-4">Memuat riwayat...</p> : (
                        searched && searchResult.length === 0 ? (
                            <p className="text-center py-10 text-gray-500">Tidak ada riwayat transaksi manual untuk anggota ini.</p>
                        ) : (
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Waktu Log</th>
                                        <th className="px-4 py-3">Periode</th>
                                        <th className="px-4 py-3">Admin</th>
                                        <th className="px-4 py-3">Jenis</th>
                                        <th className="px-4 py-3 text-right">Total Setoran</th>
                                        <th className="px-4 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchResult.map(log => {
                                        const canEdit = user?.email === 'admin@koperasi13.com' || user?.name === log.admin_nama;
                                        return (
                                            <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-dark">{formatDate(log.log_time)}</td>
                                                <td className="px-4 py-3">{new Date(`${log.periode}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</td>
                                                <td className="px-4 py-3">{log.admin_nama}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${log.type === 'EDIT' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {log.type}
                                                    </span>
                                                    {log.editedAt && <p className="text-xs text-gray-400 mt-1">Diedit: {formatDate(log.editedAt)} oleh {log.editedBy}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(log.Jumlah_setoran)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center items-center gap-3">
                                                        <button onClick={() => setSelectedLog(log)} className="text-gray-600 hover:text-gray-800" title="Lihat Detail">
                                                            Detail
                                                        </button>
                                                         <Link 
                                                            to={canEdit ? `/admin/transaksi?editLogId=${log.id}` : '#'}
                                                            className={canEdit ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 cursor-not-allowed'}
                                                            title={canEdit ? 'Edit Transaksi Ini' : 'Anda tidak dapat mengedit transaksi ini'}
                                                            onClick={(e) => !canEdit && e.preventDefault()}
                                                        >
                                                            <PencilIcon className="w-5 h-5"/>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )
                    )}
                </div>
            </div>
            {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
};

export default AdminRiwayatTransaksi;
