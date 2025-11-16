import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { TransaksiLog, Keuangan } from '../../types';
import { getLogsByAnggota, createLogFromHistory, synchronizeMissingLogs } from '../../services/transaksiLogService';
import { getHistoryByAnggota } from '../../services/keuanganService';
import { PencilIcon, PlusIcon } from '../../components/icons/Icons';
import { useAuth } from '../../context/AuthContext';

interface CombinedHistoryItem {
    id: string; // Can be log ID or history period
    type: 'log' | 'history';
    data: TransaksiLog | Keuangan;
}

const AdminRiwayatTransaksi: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [combinedHistory, setCombinedHistory] = useState<CombinedHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchNoAnggota, setSearchNoAnggota] = useState('');
    const [searchedMember, setSearchedMember] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchNoAnggota) return;
        
        setIsLoading(true);
        setSearchedMember(searchNoAnggota.toUpperCase());
        try {
            const [logsData, historyData] = await Promise.all([
                getLogsByAnggota(searchNoAnggota.toUpperCase()),
                getHistoryByAnggota(searchNoAnggota.toUpperCase())
            ]);
            
            const logPeriods = new Set(logsData.map(log => log.periode));
            
            const combined: CombinedHistoryItem[] = [];
            
            // Add all logs
            logsData.forEach(log => {
                combined.push({ id: log.id, type: 'log', data: log });
            });
            
            // Add history items that DON'T have a corresponding log
            historyData.forEach(history => {
                if (history.periode && !logPeriods.has(history.periode)) {
                    // Check if it looks like a manual transaction (has transaction values)
                     const hasTransactions = Object.entries(history).some(([key, value]) => key.startsWith('transaksi_') && typeof value === 'number' && value > 0);
                     if (hasTransactions) {
                        combined.push({ id: history.periode, type: 'history', data: history });
                     }
                }
            });
            
            // Sort combined history by period descending
            combined.sort((a, b) => {
                const periodA = 'periode' in a.data ? a.data.periode || '' : '';
                const periodB = 'periode' in b.data ? b.data.periode || '' : '';
                return periodB.localeCompare(periodA);
            });

            setCombinedHistory(combined);

        } catch (error) {
            console.error("Error fetching history:", error);
            setCombinedHistory([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCreateAndEdit = async (historyData: Keuangan) => {
        if (!historyData.periode) return;
        try {
            const newLog = await createLogFromHistory(historyData);
            navigate(`/admin/transaksi?editLogId=${newLog.id}`);
        } catch (error) {
            console.error("Failed to create log and edit:", error);
            alert("Gagal membuat riwayat untuk diedit.");
        }
    };
    
    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMessage('');
        try {
            const count = await synchronizeMissingLogs();
            setSyncMessage(`Sinkronisasi berhasil! ${count} riwayat transaksi yang hilang berhasil dibuat.`);
            // Refresh search if a member was already searched
            if (searchedMember) {
                handleSearch(new Event('submit') as any);
            }
        } catch (error) {
            console.error("Sync failed:", error);
            setSyncMessage('Sinkronisasi gagal. Silakan coba lagi.');
        } finally {
            setIsSyncing(false);
        }
    };

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div>
            <Header title="Riwayat Transaksi Manual" />
            <div className="bg-surface p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Masukkan Nomor Anggota (e.g., AK-101)"
                            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 w-full sm:w-64 text-dark"
                            value={searchNoAnggota}
                            onChange={(e) => setSearchNoAnggota(e.target.value)}
                        />
                        <button type="submit" disabled={isLoading} className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-400">
                           {isLoading ? 'Mencari...' : 'Cari'}
                        </button>
                    </form>
                    <div className="text-right">
                         <button onClick={handleSync} disabled={isSyncing} className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400">
                            {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Riwayat'}
                        </button>
                        <p className="text-xs text-gray-400 mt-1">Gunakan jika riwayat transaksi tidak muncul.</p>
                    </div>
                </div>
                 {syncMessage && (
                    <div className="mb-4 p-3 rounded-md text-sm bg-blue-900/50 text-blue-300 text-center">
                        {syncMessage}
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase">
                            <tr>
                                <th className="px-4 py-3 border-b-2 border-gray-700">WAKTU LOG</th>
                                <th className="px-4 py-3 border-b-2 border-gray-700">PERIODE</th>
                                <th className="px-4 py-3 border-b-2 border-gray-700">ADMIN</th>
                                <th className="px-4 py-3 border-b-2 border-gray-700">JENIS</th>
                                <th className="px-4 py-3 border-b-2 border-gray-700 text-right">TOTAL SETORAN</th>
                                <th className="px-4 py-3 border-b-2 border-gray-700 text-center">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-10">Memuat data...</td></tr>
                            ) : searchedMember && combinedHistory.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10">Tidak ada riwayat transaksi manual untuk anggota {searchedMember}.</td></tr>
                            ) : !searchedMember ? (
                                 <tr><td colSpan={6} className="text-center py-10">Silakan masukkan nomor anggota untuk melihat riwayat.</td></tr>
                            ) : (
                                combinedHistory.map(item => {
                                    const data = item.data;
                                    const periode = 'periode' in data ? data.periode : 'N/A';
                                    const totalSetoran = 'Jumlah_setoran' in data ? data.Jumlah_setoran : 0;
                                    
                                    if (item.type === 'log') {
                                        const log = data as TransaksiLog;
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-600">
                                                <td className="px-4 py-3">{new Date(log.log_time).toLocaleString('id-ID')}</td>
                                                <td className="px-4 py-3">{log.periode}</td>
                                                <td className="px-4 py-3">{log.admin_nama}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${log.type === 'EDIT' ? 'bg-amber-900/50 text-amber-300' : 'bg-green-900/50 text-green-300'}`}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(log.Jumlah_setoran)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        onClick={() => navigate(`/admin/transaksi?editLogId=${log.id}`)}
                                                        className="text-blue-400 hover:text-blue-300 disabled:text-gray-500"
                                                        title="Edit Transaksi"
                                                        disabled={log.admin_nama !== user?.name && user?.email !== 'admin@koperasi13.com'}
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    } else { // type === 'history'
                                        const history = data as Keuangan;
                                        return (
                                            <tr key={history.id} className="bg-yellow-900/30 hover:bg-yellow-900/40">
                                                <td className="px-4 py-3 italic text-gray-500">Belum ada Log</td>
                                                <td className="px-4 py-3">{history.periode}</td>
                                                <td className="px-4 py-3 italic">{history.admin_nama || 'Sistem'}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-600 text-gray-200">
                                                       TRANSAKSI
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(history.Jumlah_setoran)}</td>
                                                <td className="px-4 py-3 text-center">
                                                     <button 
                                                        onClick={() => handleCreateAndEdit(history)}
                                                        className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs font-bold"
                                                        title="Buat Riwayat & Edit"
                                                    >
                                                        <PlusIcon className="w-4 h-4" /> BUAT & EDIT
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminRiwayatTransaksi;