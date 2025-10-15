import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import { PengajuanPinjaman } from '../../types';
import { CheckIcon, XMarkIcon } from '../../components/icons/Icons';
import { getAllPengajuanPinjaman, updatePengajuanStatus } from '../../services/pinjamanService';

type StatusFilter = 'Semua' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';

const AdminPinjaman: React.FC = () => {
    const [pinjamanList, setPinjamanList] = useState<PengajuanPinjaman[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<StatusFilter>('Menunggu Persetujuan');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    useEffect(() => {
        const fetchPinjaman = async () => {
            setIsLoading(true);
            const data = await getAllPengajuanPinjaman();
            setPinjamanList(data);
            setIsLoading(false);
        };
        fetchPinjaman();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: 'Disetujui' | 'Ditolak') => {
        if (!window.confirm(`Apakah Anda yakin ingin ${newStatus === 'Disetujui' ? 'menyetujui' : 'menolak'} pengajuan ini?`)) {
            return;
        }
        setIsUpdating(id);
        try {
            await updatePengajuanStatus(id, newStatus);
            setPinjamanList(prevList =>
                prevList.map(p => (p.id === id ? { ...p, status: newStatus } : p))
            );
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Gagal memperbarui status.");
        } finally {
            setIsUpdating(null);
        }
    };

    const filteredPinjaman = useMemo(() => {
        if (activeTab === 'Semua') {
            return pinjamanList;
        }
        return pinjamanList.filter(p => p.status === activeTab);
    }, [pinjamanList, activeTab]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const StatusBadge: React.FC<{ status: PengajuanPinjaman['status'] }> = ({ status }) => {
        const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
        let colorClasses = '';
        switch (status) {
            case 'Menunggu Persetujui':
                colorClasses = 'bg-yellow-100 text-yellow-800';
                break;
            case 'Disetujui':
                colorClasses = 'bg-green-100 text-green-800';
                break;
            case 'Ditolak':
                colorClasses = 'bg-red-100 text-red-800';
                break;
            default:
                colorClasses = 'bg-gray-100 text-gray-800';
        }
        return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
    };

    return (
        <div>
            <Header title="Pengajuan Pinjaman" />
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        {(['Menunggu Persetujui', 'Disetujui', 'Ditolak', 'Semua'] as StatusFilter[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <p className="text-center py-10">Memuat data pengajuan...</p>
                    ) : filteredPinjaman.length > 0 ? (
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Nama Anggota</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3 text-right">Jumlah</th>
                                    <th className="px-4 py-3 text-center">Jangka Waktu</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPinjaman.map(p => (
                                    <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{p.nama_anggota}</td>
                                        <td className="px-4 py-3">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(p.pokok_pinjaman)}</td>
                                        <td className="px-4 py-3 text-center">{p.jangka_waktu} bulan</td>
                                        <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                                        <td className="px-4 py-3">
                                            {p.status === 'Menunggu Persetujui' ? (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(p.id, 'Disetujui')}
                                                        disabled={isUpdating === p.id}
                                                        className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50"
                                                        title="Setujui"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(p.id, 'Ditolak')}
                                                        disabled={isUpdating === p.id}
                                                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
                                                        title="Tolak"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-400">-</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center py-10 text-gray-500">Tidak ada pengajuan dengan status '{activeTab}'.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPinjaman;
