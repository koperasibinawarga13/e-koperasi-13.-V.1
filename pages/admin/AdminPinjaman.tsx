import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { PengajuanPinjaman } from '../../types';
import { CheckIcon, XMarkIcon } from '../../components/icons/Icons';
import { getAllPengajuanPinjaman, updatePengajuanStatus } from '../../services/pinjamanService';
import Modal from '../../components/Modal';

type StatusFilter = 'Semua' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';

const AdminPinjaman: React.FC = () => {
    const [pinjamanList, setPinjamanList] = useState<PengajuanPinjaman[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<StatusFilter>('Menunggu Persetujuan');
    
    // State for action modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPinjaman, setCurrentPinjaman] = useState<PengajuanPinjaman | null>(null);
    const [actionType, setActionType] = useState<'Disetujui' | 'Ditolak' | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchPinjaman = async () => {
            setIsLoading(true);
            const data = await getAllPengajuanPinjaman();
            setPinjamanList(data);
            setIsLoading(false);
        };
        fetchPinjaman();
    }, []);

    const handleActionClick = (pinjaman: PengajuanPinjaman, type: 'Disetujui' | 'Ditolak') => {
        setCurrentPinjaman(pinjaman);
        setActionType(type);
        setAdminNotes(pinjaman.catatan_admin || ''); // Pre-fill with existing notes
        setIsModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!currentPinjaman || !actionType) return;
        
        setIsUpdating(true);
        try {
            await updatePengajuanStatus(currentPinjaman.id!, actionType, adminNotes);
            setPinjamanList(prevList =>
                prevList.map(p => (p.id === currentPinjaman.id ? { ...p, status: actionType, catatan_admin: adminNotes } : p))
            );
            closeModal();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Gagal memperbarui status.");
        } finally {
            setIsUpdating(false);
        }
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentPinjaman(null);
        setActionType(null);
        setAdminNotes('');
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
            case 'Menunggu Persetujuan':
                colorClasses = 'bg-amber-900/50 text-amber-300';
                break;
            case 'Disetujui':
                colorClasses = 'bg-green-900/50 text-green-300';
                break;
            case 'Ditolak':
                colorClasses = 'bg-red-900/50 text-red-300';
                break;
            default:
                colorClasses = 'bg-gray-700 text-gray-300';
        }
        return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
    };

    return (
        <div>
            <Header title="Pengajuan Pinjaman" />
            <div className="bg-surface p-6 rounded-xl border border-gray-700">
                <div className="border-b border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        {(['Menunggu Persetujuan', 'Disetujui', 'Ditolak', 'Semua'] as StatusFilter[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <p className="text-center py-10 text-gray-400">Memuat data pengajuan...</p>
                    ) : filteredPinjaman.length > 0 ? (
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-400 uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-semibold border-b-2 border-gray-700">No. Pengajuan</th>
                                    <th className="px-4 py-3 font-semibold border-b-2 border-gray-700">Nama Anggota</th>
                                    <th className="px-4 py-3 font-semibold border-b-2 border-gray-700">Jenis Pinjaman</th>
                                    <th className="px-4 py-3 font-semibold border-b-2 border-gray-700">Tanggal</th>
                                    <th className="px-4 py-3 font-semibold border-b-2 border-gray-700 text-right">Jumlah</th>
                                    <th className="px-4 py-3 font-semibold border-b-2 border-gray-700 text-center">Jangka Waktu</th>
                                    <th className="px-4 py-3 font-semibold border-b-2 border-gray-700 text-center">Status</th>
                                    <th className="px-4 py-3 font-semibold border-b-2 border-gray-700">Catatan Admin</th>
                                    <th className="px-4 py-3 font-semibold border-b-2 border-gray-700 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredPinjaman.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-600 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link to={`/admin/pinjaman/${p.id}`} className="text-primary font-semibold hover:underline">
                                                {`${p.no_anggota.replace(/-/g, '')}${new Date(p.tanggal_pengajuan).toLocaleDateString('sv-SE').replace(/-/g, '')}`}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-dark">{p.nama_anggota}</td>
                                        <td className="px-4 py-3 font-semibold">{p.jenis_pinjaman}</td>
                                        <td className="px-4 py-3">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(p.pokok_pinjaman)}</td>
                                        <td className="px-4 py-3 text-center">{p.jangka_waktu ? `${p.jangka_waktu} bulan` : '-'}</td>
                                        <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                                        <td className="px-4 py-3 text-xs max-w-xs truncate">{p.catatan_admin || '-'}</td>
                                        <td className="px-4 py-3">
                                            {p.status === 'Menunggu Persetujuan' ? (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleActionClick(p, 'Disetujui')}
                                                        className="p-2 rounded-full bg-green-900/50 text-green-300 hover:bg-green-800/50"
                                                        title="Setujui"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleActionClick(p, 'Ditolak')}
                                                        className="p-2 rounded-full bg-red-900/50 text-red-300 hover:bg-red-800/50"
                                                        title="Tolak"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-500">-</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center py-10 text-gray-400">Tidak ada pengajuan dengan status '{activeTab}'.</p>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title={`${actionType} Pengajuan Pinjaman`}>
                <div>
                    <p className="mb-4 text-dark">
                        Anda akan <span className="font-bold">{actionType?.toLowerCase()}</span> pengajuan untuk <span className="font-bold">{currentPinjaman?.nama_anggota}</span>.
                    </p>
                    <div>
                        <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-300">
                           Catatan / Alasan (Opsional)
                        </label>
                        <textarea
                            id="adminNotes"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={4}
                            className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-dark"
                            placeholder={actionType === 'Ditolak' ? 'Contoh: Total pinjaman aktif melebihi batas.' : 'Contoh: Disetujui dengan syarat...'}
                        />
                    </div>
                     <div className="flex justify-end gap-4 mt-6">
                        <button onClick={closeModal} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-500">Batal</button>
                        <button
                            onClick={handleConfirmAction}
                            disabled={isUpdating}
                            className={`px-4 py-2 rounded-lg font-semibold text-white disabled:bg-gray-500 ${actionType === 'Disetujui' ? 'bg-secondary hover:bg-secondary-dark' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            {isUpdating ? 'Memproses...' : `Konfirmasi & ${actionType}`}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminPinjaman;