import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { TransaksiLog, Keuangan } from '../../types';
import { getLogsByAnggota, createLogFromHistory, synchronizeMissingLogs } from '../../services/transaksiLogService';
import { getHistoryByAnggota, rebuildUploadHistory, rebuildFinancialDataFromMonth, getUploadMonthsFromCollection } from '../../services/keuanganService';
import { getAnggota } from '../../services/anggotaService';
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
    const [searchMode, setSearchMode] = useState<'no_anggota' | 'nama'>('no_anggota');
    const [searchedMember, setSearchedMember] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRecalculatingPeriod, setIsRecalculatingPeriod] = useState(false);
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [syncMessage, setSyncMessage] = useState('');
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedQuery = searchNoAnggota.trim();
        if (!trimmedQuery) return;
        
        setIsLoading(true);
        setSyncMessage('');
        try {
            let targetNoAnggota = trimmedQuery;

            if (searchMode === 'nama') {
                const allAnggota = await getAnggota();
                const query = trimmedQuery.toLowerCase();
                const matches = allAnggota.filter(anggota => anggota.nama.toLowerCase().includes(query));

                if (matches.length === 0) {
                    setCombinedHistory([]);
                    setSearchedMember(null);
                    setSyncMessage('Tidak ada anggota yang cocok dengan nama yang dicari.');
                    return;
                }

                targetNoAnggota = matches[0].no_anggota;
            } else {
                targetNoAnggota = trimmedQuery.toUpperCase();
            }

            setSearchedMember(targetNoAnggota);
            const [logsData, historyData] = await Promise.all([
                getLogsByAnggota(targetNoAnggota),
                getHistoryByAnggota(targetNoAnggota)
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
            setSearchedMember(null);
            setSyncMessage('Gagal memuat riwayat transaksi.');
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
                // To avoid form submission side-effects, create a dummy event
                const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
                handleSearch(dummyEvent);
            }
        } catch (error) {
            console.error("Sync failed:", error);
            setSyncMessage('Sinkronisasi gagal. Silakan coba lagi.');
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        const fetchMonths = async () => {
            try {
                const months = await getUploadMonthsFromCollection();
                setAvailableMonths(months);
                if (months.length > 0 && !selectedMonth) setSelectedMonth(months[0]);
            } catch (error) {
                console.error('Failed to load available months:', error);
            }
        };
        fetchMonths();
    }, []);

    const handleRecalculatePeriod = async () => {
        if (!selectedMonth) return;
        setIsRecalculatingPeriod(true);
        setSyncMessage('');
        try {
            await rebuildUploadHistory();

            if (selectedMonth === 'ALL') {
                if (!availableMonths || availableMonths.length === 0) {
                    setSyncMessage('Tidak ada periode tersedia untuk direkalkulasi.');
                    return;
                }
                // Choose the earliest available month (YYYY-MM strings sort lexicographically)
                const monthsSorted = [...availableMonths].sort();
                const earliest = monthsSorted[0];
                await rebuildFinancialDataFromMonth(earliest);
                setSyncMessage('Rekalkulasi untuk semua periode selesai.');
            } else {
                await rebuildFinancialDataFromMonth(selectedMonth);
                setSyncMessage(`Rekalkulasi periode ${selectedMonth} selesai.`);
            }

            if (searchedMember) {
                const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
                handleSearch(dummyEvent);
            }
        } catch (error) {
            console.error('Recalculate period failed:', error);
            setSyncMessage('Gagal melakukan rekalkulasi periode.');
        } finally {
            setIsRecalculatingPeriod(false);
        }
    };

    // Global recalculate removed to prefer per-periode recalculation from Upload page.

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div>
            <Header title="Riwayat Transaksi Manual" />
            <div className="bg-surface p-6 rounded-xl shadow-md">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch gap-2 w-full xl:w-auto">
                        <select
                            value={searchMode}
                            onChange={(e) => setSearchMode(e.target.value as 'no_anggota' | 'nama')}
                            className="bg-zinc-800 rounded-lg px-3 py-2 text-dark focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                            <option value="no_anggota">Nomor Anggota</option>
                            <option value="nama">Nama</option>
                        </select>
                        <input
                            type="text"
                            placeholder={searchMode === 'no_anggota' ? 'Masukkan nomor anggota (contoh: AK-101)' : 'Masukkan nama anggota'}
                            className="bg-zinc-800 rounded-lg px-4 py-2 w-full sm:w-64 focus:ring-1 focus:ring-primary focus:border-primary text-dark"
                            value={searchNoAnggota}
                            onChange={(e) => setSearchNoAnggota(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-primary text-black px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-zinc-700 whitespace-nowrap"
                        >
                           {isLoading ? 'Mencari...' : 'Cari'}
                        </button>
                    </form>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 xl:justify-end w-full xl:w-auto">
                         <button onClick={handleSync} disabled={isSyncing} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-zinc-700 whitespace-nowrap">
                            {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Riwayat'}
                        </button>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-zinc-800 rounded-lg px-3 py-2 text-dark focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Pilih Periode</option>
                                <option value="ALL">Semua Periode</option>
                                {availableMonths.map(m => (
                                    <option key={m} value={m}>{new Date(`${m}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option>
                                ))}
                            </select>
                            <button onClick={handleRecalculatePeriod} disabled={!selectedMonth || isRecalculatingPeriod} className="bg-amber-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-white whitespace-nowrap">
                                {isRecalculatingPeriod ? 'Memproses...' : 'Update & Rekalkulasi Periode'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-text sm:text-right">Gunakan untuk menambah riwayat yang hilang atau mengulang perhitungan keseluruhan.</p>
                    </div>
                </div>
                 {syncMessage && (
                    <div className="mb-4 p-3 rounded-md text-sm bg-secondary-light text-secondary text-center">
                        {syncMessage}
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-text">
                        <thead className="text-xs text-gray-text uppercase border-b border-zinc-800">
                            <tr>
                                <th className="px-4 py-3">WAKTU LOG</th>
                                <th className="px-4 py-3">PERIODE</th>
                                <th className="px-4 py-3">ADMIN</th>
                                <th className="px-4 py-3">JENIS</th>
                                <th className="px-4 py-3 text-right">TOTAL SETORAN</th>
                                <th className="px-4 py-3 text-center">AKSI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-10">Memuat data...</td></tr>
                            ) : searchedMember && combinedHistory.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10">Tidak ada riwayat transaksi manual untuk anggota {searchedMember}.</td></tr>
                            ) : !searchedMember ? (
                                 <tr><td colSpan={6} className="text-center py-10">Silakan masukkan nomor anggota atau nama untuk melihat riwayat.</td></tr>
                            ) : (
                                combinedHistory.map(item => {
                                    const data = item.data;
                                    const periode = 'periode' in data ? data.periode : 'N/A';
                                    const totalSetoran = 'Jumlah_setoran' in data ? data.Jumlah_setoran : 0;
                                    
                                    if (item.type === 'log') {
                                        const log = data as TransaksiLog;
                                        return (
                                            <tr key={log.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                                                <td className="px-4 py-3">{new Date(log.log_time).toLocaleString('id-ID')}</td>
                                                <td className="px-4 py-3">{log.periode}</td>
                                                <td className="px-4 py-3 text-dark">{log.admin_nama}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${log.type === 'EDIT' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-dark">{formatCurrency(log.Jumlah_setoran)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        onClick={() => navigate(`/admin/transaksi?editLogId=${log.id}`)}
                                                        className="text-primary hover:text-primary-dark disabled:text-zinc-600"
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
                                            <tr key={history.periode} className="bg-amber-500/10 hover:bg-amber-500/20 border-t border-amber-900/50">
                                                <td className="px-4 py-3 italic text-gray-text">Belum ada Log</td>
                                                <td className="px-4 py-3">{history.periode}</td>
                                                <td className="px-4 py-3 italic text-dark">{history.admin_nama || 'Sistem'}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-zinc-700 text-zinc-300">
                                                       TRANSAKSI
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-dark">{formatCurrency(history.Jumlah_setoran)}</td>
                                                <td className="px-4 py-3 text-center">
                                                     <button 
                                                        onClick={() => handleCreateAndEdit(history)}
                                                        className="text-green-400 hover:text-green-500 flex items-center gap-1 text-xs font-bold"
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
