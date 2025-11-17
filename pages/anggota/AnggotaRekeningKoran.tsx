
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Keuangan, Anggota } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getAnggotaById } from '../../services/anggotaService';
import { getHistoryByAnggota } from '../../services/keuanganService';
import { ChevronLeftIcon } from '../../components/icons/Icons';

type AccountType = 
  | 'simpanan_pokok' 
  | 'simpanan_wajib' 
  | 'simpanan_sukarela' 
  | 'simpanan_wisata' 
  | 'pinjaman_berjangka' 
  | 'pinjaman_khusus' 
  | 'pinjaman_niaga';

const accountOptions: { value: AccountType; label: string }[] = [
    { value: 'simpanan_pokok', label: 'Simpanan Pokok' },
    { value: 'simpanan_wajib', label: 'Simpanan Wajib' },
    { value: 'simpanan_sukarela', label: 'Simpanan Sukarela' },
    { value: 'simpanan_wisata', label: 'Simpanan Wisata' },
    { value: 'pinjaman_berjangka', label: 'Pinjaman Berjangka' },
    { value: 'pinjaman_khusus', label: 'Pinjaman Khusus' },
    { value: 'pinjaman_niaga', label: 'Pinjaman Niaga' },
];

const fieldMapping: Record<AccountType, { kredit: keyof Keuangan; debit: keyof Keuangan; saldo: keyof Keuangan }> = {
  simpanan_pokok: { kredit: 'transaksi_simpanan_pokok', debit: 'transaksi_pengambilan_simpanan_pokok', saldo: 'akhir_simpanan_pokok' },
  simpanan_wajib: { kredit: 'transaksi_simpanan_wajib', debit: 'transaksi_pengambilan_simpanan_wajib', saldo: 'akhir_simpanan_wajib' },
  simpanan_sukarela: { kredit: 'transaksi_simpanan_sukarela', debit: 'transaksi_pengambilan_simpanan_sukarela', saldo: 'akhir_simpanan_sukarela' },
  simpanan_wisata: { kredit: 'transaksi_simpanan_wisata', debit: 'transaksi_pengambilan_simpanan_wisata', saldo: 'akhir_simpanan_wisata' },
  pinjaman_berjangka: { kredit: 'transaksi_penambahan_pinjaman_berjangka', debit: 'transaksi_pinjaman_berjangka', saldo: 'akhir_pinjaman_berjangka' },
  pinjaman_khusus: { kredit: 'transaksi_penambahan_pinjaman_khusus', debit: 'transaksi_pinjaman_khusus', saldo: 'akhir_pinjaman_khusus' },
  pinjaman_niaga: { kredit: 'transaksi_penambahan_pinjaman_niaga', debit: 'transaksi_niaga', saldo: 'akhir_pinjaman_niaga' },
};


const AnggotaRekeningKoran: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState<Keuangan[]>([]);
    const [anggota, setAnggota] = useState<Anggota | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState<AccountType>('simpanan_wajib');

    useEffect(() => {
        const fetchData = async () => {
            if (user?.anggotaId) {
                try {
                    const anggotaData = await getAnggotaById(user.anggotaId);
                    setAnggota(anggotaData);
                    if (anggotaData?.no_anggota) {
                        const historyData = await getHistoryByAnggota(anggotaData.no_anggota);
                        setHistory(historyData.reverse()); // Sort oldest to newest
                    }
                } catch (error) {
                    console.error("Error fetching history data:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatPeriod = (period: string) => {
        return new Date(`${period}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    const transactionData = useMemo(() => {
        const mapping = fieldMapping[selectedAccount];
        return history
            .map(record => {
                const kredit = record[mapping.kredit] as number || 0;
                const debit = record[mapping.debit] as number || 0;
                const saldo = record[mapping.saldo] as number || 0;
                
                // Only include months where there was a transaction or a balance
                if (kredit !== 0 || debit !== 0 || saldo !== 0) {
                    return {
                        periode: record.periode,
                        kredit,
                        debit,
                        saldo
                    };
                }
                return null;
            })
            .filter(Boolean); // Remove null entries
    }, [history, selectedAccount]);

    const latestBalance = useMemo(() => {
        if (history.length === 0) return 0;
        const latestRecord = history[history.length - 1];
        const mapping = fieldMapping[selectedAccount];
        return latestRecord[mapping.saldo] as number || 0;
    }, [history, selectedAccount]);
    
    const selectedAccountLabel = accountOptions.find(opt => opt.value === selectedAccount)?.label;

    return (
        <div>
             <div className="bg-surface p-6 rounded-lg mb-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="flex-shrink-0 bg-zinc-800 p-2 rounded-full hover:bg-zinc-700 transition-colors">
                            <ChevronLeftIcon className="w-5 h-5 text-dark" />
                        </button>
                        <div>
                             <h1 className="text-xl sm:text-2xl font-bold text-dark">Rekening Koran</h1>
                             <p className="text-sm text-gray-text">{anggota?.nama}</p>
                        </div>
                    </div>
                     <div className="w-full sm:w-auto">
                        <select
                            id="account-select"
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value as AccountType)}
                            className="w-full sm:w-64 bg-zinc-800 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-dark"
                        >
                           {accountOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading && <p className="text-center p-10 text-gray-text">Memuat riwayat transaksi...</p>}

            {!isLoading && (
                <>
                    <div className="bg-surface p-6 rounded-xl mb-8">
                        <p className="text-sm text-gray-text">Saldo Terkini - {selectedAccountLabel}</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(latestBalance)}</p>
                    </div>

                    <div className="bg-surface p-6 rounded-xl">
                         <h2 className="text-lg font-bold text-dark mb-4">Rincian Transaksi - {selectedAccountLabel}</h2>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-text">
                                <thead className="text-xs text-gray-text uppercase border-b border-zinc-800">
                                    <tr>
                                        <th scope="col" className="px-4 py-4 font-semibold">Periode</th>
                                        <th scope="col" className="px-4 py-4 font-semibold">Keterangan</th>
                                        <th scope="col" className="px-4 py-4 font-semibold text-right">Debit</th>
                                        <th scope="col" className="px-4 py-4 font-semibold text-right">Kredit</th>
                                        <th scope="col" className="px-4 py-4 font-semibold text-right">Saldo Akhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionData.length > 0 ? transactionData.map((item, index) => (
                                        <tr key={`${item?.periode}-${index}`} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-4 py-4 font-medium text-dark whitespace-nowrap">{formatPeriod(item!.periode!)}</td>
                                            <td className="px-4 py-4">Transaksi Bulan Ini</td>
                                            <td className="px-4 py-4 text-right font-mono text-red-400">
                                                {item!.debit > 0 ? formatCurrency(item!.debit) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-green-400">
                                                {item!.kredit > 0 ? formatCurrency(item!.kredit) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-dark">{formatCurrency(item!.saldo)}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 text-gray-text">
                                                Tidak ada riwayat transaksi untuk rekening ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnggotaRekeningKoran;
