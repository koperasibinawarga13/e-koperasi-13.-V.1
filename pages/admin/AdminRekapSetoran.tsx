import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { getAdmins } from '../../services/adminService';
import { getLogsByAdminAndPeriod, getAvailableLogPeriods } from '../../services/transaksiLogService';
import { AdminUser, TransaksiLog } from '../../types';
import { PrintIcon } from '../../components/icons/Icons';

const AdminRekapTransaksiManual: React.FC = () => {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
    const [selectedAdmin, setSelectedAdmin] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [rekapData, setRekapData] = useState<TransaksiLog[] | null>(null);
    const [totalSetoran, setTotalSetoran] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            const [adminData, periodData] = await Promise.all([
                getAdmins(),
                getAvailableLogPeriods()
            ]);
            setAdmins(adminData);
            setAvailablePeriods(periodData);
            if (periodData.length > 0) {
                setSelectedPeriod(periodData[0]);
            }
        };
        fetchInitialData();
    }, []);

    const handleGenerateReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAdmin || !selectedPeriod) {
            alert('Silakan pilih admin dan periode.');
            return;
        }
        setIsLoading(true);
        setRekapData(null);
        try {
            const data = await getLogsByAdminAndPeriod(selectedAdmin, selectedPeriod);
            const total = data.reduce((sum, log) => sum + (log.Jumlah_setoran || 0), 0);
            setRekapData(data);
            setTotalSetoran(total);
        } catch (error) {
            console.error("Failed to generate report:", error);
            alert("Gagal membuat laporan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const formatDate = (isoString: string) => new Date(isoString).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
    const formatPeriod = (period: string) => new Date(`${period}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <div>
            <Header title="Rekapitulasi Transaksi Manual" />

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 print:hidden">
                <form onSubmit={handleGenerateReport} className="flex flex-wrap items-end gap-4">
                    <div>
                        <label htmlFor="periode" className="block text-sm font-medium text-gray-700">Periode Laporan</label>
                        <select
                            id="periode"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md border"
                        >
                            {availablePeriods.map(p => <option key={p} value={p}>{formatPeriod(p)}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="admin" className="block text-sm font-medium text-gray-700">Nama Admin</label>
                        <select
                            id="admin"
                            value={selectedAdmin}
                            onChange={(e) => setSelectedAdmin(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md border"
                        >
                            <option value="">-- Pilih Admin --</option>
                            {admins.map(admin => <option key={admin.id} value={admin.nama}>{admin.nama}</option>)}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-400"
                    >
                        {isLoading ? 'Memuat...' : 'Tampilkan Rekap'}
                    </button>
                </form>
            </div>

            {/* Report Section */}
            {rekapData && (
                <div id="rekap-content" className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-dark">Rekapitulasi Transaksi Manual</h2>
                            <p className="text-gray-600">
                                <strong>Admin:</strong> {selectedAdmin} <br />
                                <strong>Periode:</strong> {formatPeriod(selectedPeriod)}
                            </p>
                        </div>
                        <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 print:hidden">
                            <PrintIcon className="w-5 h-5" /> Cetak
                        </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-center">
                        <p className="text-sm font-medium text-blue-800">TOTAL SETORAN TUNAI PERIODE INI</p>
                        <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalSetoran)}</p>
                    </div>

                    <h3 className="text-lg font-semibold text-dark mb-4">Rincian Transaksi</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Tanggal Input</th>
                                    <th className="px-4 py-3">No. Anggota</th>
                                    <th className="px-4 py-3">Nama Anggota</th>
                                    <th className="px-4 py-3 text-right">Jumlah Setoran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rekapData.map(log => (
                                    <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3">{formatDate(log.log_time)}</td>
                                        <td className="px-4 py-3">{log.no_anggota}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{log.nama_angota}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(log.Jumlah_setoran)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
             {!rekapData && !isLoading && (
                <div className="text-center py-10 text-gray-500">
                    <p>Silakan pilih periode dan admin untuk menampilkan rekapitulasi setoran.</p>
                </div>
             )}
             
            <style>{`
                @media print {
                    body {
                        background-color: white !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    #rekap-content {
                        box-shadow: none !important;
                        border: 1px solid #ccc;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminRekapTransaksiManual;