import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { PengajuanPinjaman } from '../../types';
import { getPengajuanPinjamanById, updatePengajuanStatus } from '../../services/pinjamanService';
import { ChevronLeftIcon, CheckIcon, XMarkIcon } from '../../components/icons/Icons';

// Reusable helper components
const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-dark">{value}</p>
    </div>
);

const StatusBadge: React.FC<{ status: PengajuanPinjaman['status'] }> = ({ status }) => {
    const baseClasses = 'px-3 py-1 text-sm font-bold rounded-full inline-block';
    let colorClasses = '';
    switch (status) {
        case 'Menunggu Persetujuan': colorClasses = 'bg-yellow-100 text-yellow-800'; break;
        case 'Disetujui': colorClasses = 'bg-green-100 text-green-800'; break;
        case 'Ditolak': colorClasses = 'bg-red-100 text-red-800'; break;
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
};


const AdminPinjamanDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pinjaman, setPinjaman] = useState<PengajuanPinjaman | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                setIsLoading(true);
                const data = await getPengajuanPinjamanById(id);
                setPinjaman(data);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleStatusUpdate = async (newStatus: 'Disetujui' | 'Ditolak') => {
        if (!pinjaman || !window.confirm(`Apakah Anda yakin ingin ${newStatus === 'Disetujui' ? 'menyetujui' : 'menolak'} pengajuan ini?`)) {
            return;
        }
        setIsUpdating(true);
        try {
            await updatePengajuanStatus(pinjaman.id, newStatus);
            setPinjaman(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Gagal memperbarui status.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Memuat detail pengajuan...</div>;
    }

    if (!pinjaman) {
        return (
            <div className="p-8 text-center">
                <Header title="Pengajuan Tidak Ditemukan" />
                <p>Data pengajuan pinjaman tidak ditemukan.</p>
                <Link to="/admin/pinjaman" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
                    <ChevronLeftIcon className="w-4 h-4" />
                    Kembali ke Daftar Pinjaman
                </Link>
            </div>
        );
    }

    const pengajuanId = `${pinjaman.no_anggota.replace(/-/g, '')}${new Date(pinjaman.tanggal_pengajuan).toLocaleDateString('sv-SE').replace(/-/g, '')}`;

    return (
        <div>
            <Header title={`Detail Pengajuan: ${pengajuanId}`} />
            
            <div className="mb-6">
                <Link to="/admin/pinjaman" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5" />
                    Kembali ke Daftar Pinjaman
                </Link>
            </div>

            {/* Main Details Card */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoItem label="Nama Anggota" value={pinjaman.nama_anggota} />
                    <InfoItem label="No. Anggota" value={pinjaman.no_anggota} />
                    <InfoItem label="Tanggal Pengajuan" value={formatDate(pinjaman.tanggal_pengajuan)} />
                    <InfoItem label="Status" value={<StatusBadge status={pinjaman.status} />} />
                </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h3 className="text-lg md:text-xl font-bold text-dark border-b pb-3 mb-4">Ringkasan Finansial</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoItem label="Jenis Pinjaman" value={<span className="font-bold">{pinjaman.jenis_pinjaman}</span>} />
                    <InfoItem label="Pokok Pinjaman" value={<span className="text-green-600 font-bold">{formatCurrency(pinjaman.pokok_pinjaman)}</span>} />
                    {pinjaman.jenis_pinjaman === 'Berjangka' && (
                        <>
                            <InfoItem label="Jangka Waktu" value={`${pinjaman.jangka_waktu} Bulan`} />
                            <InfoItem label="Bunga per Bulan" value={`${pinjaman.bunga_per_bulan}%`} />
                            <InfoItem label="Total Bunga" value={formatCurrency(pinjaman.total_bunga)} />
                            <InfoItem label="Total Pembayaran" value={<span className="text-blue-600 font-bold">{formatCurrency(pinjaman.total_bayar)}</span>} />
                            <InfoItem label="Angsuran Pokok/Bulan" value={formatCurrency(pinjaman.angsuran_pokok_bulan)} />
                            <InfoItem label="Total Angsuran/Bulan" value={formatCurrency(pinjaman.jadwal_angsuran?.[0]?.totalAngsuran)} />
                        </>
                    )}
                </div>
                 {pinjaman.jenis_pinjaman === 'Khusus' && (
                    <div className="mt-4 pt-4 border-t">
                        <InfoItem label="Keterangan" value={<p className="whitespace-pre-wrap">{pinjaman.keterangan || '-'}</p>} />
                    </div>
                 )}
            </div>

            {/* Action Buttons */}
            {pinjaman.status === 'Menunggu Persetujuan' && (
                <div className="bg-white p-6 rounded-xl shadow-md mb-8 flex justify-center items-center gap-6">
                    <h3 className="text-base md:text-lg font-semibold text-dark">Tindakan Persetujuan:</h3>
                    <button onClick={() => handleStatusUpdate('Disetujui')} disabled={isUpdating} className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-400">
                        <CheckIcon className="w-5 h-5" /> {isUpdating ? 'Memproses...' : 'Setujui'}
                    </button>
                    <button onClick={() => handleStatusUpdate('Ditolak')} disabled={isUpdating} className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600 disabled:bg-gray-400">
                        <XMarkIcon className="w-5 h-5" /> {isUpdating ? 'Memproses...' : 'Tolak'}
                    </button>
                </div>
            )}
            
            {/* Installment Table */}
            {pinjaman.jenis_pinjaman === 'Berjangka' && pinjaman.jadwal_angsuran && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg md:text-xl font-bold text-dark mb-4">Jadwal Angsuran</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Bulan Ke</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3 text-right">Angsuran Pokok</th>
                                    <th className="px-4 py-3 text-right">Angsuran Bunga</th>
                                    <th className="px-4 py-3 text-right">Total Angsuran</th>
                                    <th className="px-4 py-3 text-right">Sisa Pinjaman</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pinjaman.jadwal_angsuran.map(row => (
                                    <tr key={row.bulan} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{row.bulan}</td>
                                        <td className="px-4 py-3">{formatDate(row.tanggal)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(row.angsuranPokok)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(row.angsuranBunga)}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-dark">{formatCurrency(row.totalAngsuran)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(row.sisaPinjaman)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPinjamanDetail;