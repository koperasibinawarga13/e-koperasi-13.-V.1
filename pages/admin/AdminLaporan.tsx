import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { CreditCardIcon, ChartBarIcon, DownloadIcon } from '../../components/icons/Icons';
import { getKeuangan } from '../../services/keuanganService';
import { Keuangan } from '../../types';

const AdminLaporan: React.FC = () => {
    const [keuanganList, setKeuanganList] = useState<Keuangan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getKeuangan();
            // Sort data by no_anggota in ascending order
            const sortedData = data.sort((a, b) => a.no_anggota.localeCompare(b.no_anggota));
            setKeuanganList(sortedData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };
    
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            if (keuanganList.length === 0) {
                alert('Tidak ada data untuk diunduh.');
                return;
            }

            const dataToExport = keuanganList.map(k => ({
                'No Anggota': k.no_anggota,
                'Nama': k.nama_angota,
                'Periode Laporan Terakhir': k.periode || '',
                'Akhir Simpanan Pokok': k.akhir_simpanan_pokok,
                'Akhir Simpanan Wajib': k.akhir_simpanan_wajib,
                'Akhir Simpanan Sukarela': k.akhir_simpanan_sukarela,
                'Akhir Simpanan Wisata': k.akhir_simpanan_wisata,
                'Total Simpanan': k.jumlah_total_simpanan,
                'Akhir Pinjaman Berjangka': k.akhir_pinjaman_berjangka,
                'Akhir Pinjaman Khusus': k.akhir_pinjaman_khusus,
                'Total Pinjaman': k.jumlah_total_pinjaman,
                'Transaksi Simpanan Pokok': k.transaksi_simpanan_pokok,
                'Transaksi Simpanan Wajib': k.transaksi_simpanan_wajib,
                'Transaksi Simpanan Sukarela': k.transaksi_simpanan_sukarela,
                'Transaksi Simpanan Wisata': k.transaksi_simpanan_wisata,
                'Transaksi Pinjaman Berjangka': k.transaksi_pinjaman_berjangka,
                'Transaksi Pinjaman Khusus': k.transaksi_pinjaman_khusus,
                'Transaksi Simpanan Jasa': k.transaksi_simpanan_jasa,
                'Transaksi Niaga': k.transaksi_niaga,
                'Transaksi Dana Perlaya': k.transaksi_dana_perlaya,
                'Transaksi Dana Katineng': k.transaksi_dana_katineng,
                'Jumlah Setoran': k.Jumlah_setoran,
                'Pengambilan Simpanan Pokok': k.transaksi_pengambilan_simpanan_pokok,
                'Pengambilan Simpanan Wajib': k.transaksi_pengambilan_simpanan_wajib,
                'Pengambilan Simpanan Sukarela': k.transaksi_pengambilan_simpanan_sukarela,
                'Pengambilan Simpanan Wisata': k.transaksi_pengambilan_simpanan_wisata,
                'Penambahan Pinjaman Berjangka': k.transaksi_penambahan_pinjaman_berjangka,
                'Penambahan Pinjaman Khusus': k.transaksi_penambahan_pinjaman_khusus,
                'Penambahan Pinjaman Niaga': k.transaksi_penambahan_pinjaman_niaga,
                'Awal Simpanan Pokok': k.awal_simpanan_pokok,
                'Awal Simpanan Wajib': k.awal_simpanan_wajib,
                'Awal Simpanan Sukarela': k.sukarela,
                'Awal Simpanan Wisata': k.awal_simpanan_wisata,
                'Awal Pinjaman Berjangka': k.awal_pinjaman_berjangka,
                'Awal Pinjaman Khusus': k.awal_pinjaman_khusus,
            }));
            
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");

            const today = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `Laporan_Keuangan_Koperasi_${today}.xlsx`);

        } catch (error) {
            console.error("Gagal mengunduh laporan:", error);
            alert("Terjadi kesalahan saat menyiapkan file unduhan.");
        } finally {
            setIsDownloading(false);
        }
    };

    const summaryData = useMemo(() => {
        return keuanganList.reduce(
            (acc, curr) => {
                acc.totalSimpanan += curr.jumlah_total_simpanan || 0;
                acc.totalPinjaman += curr.jumlah_total_pinjaman || 0;
                return acc;
            },
            { totalSimpanan: 0, totalPinjaman: 0 }
        );
    }, [keuanganList]);
    
    const filteredKeuangan = useMemo(() =>
        keuanganList.filter(k =>
            k.nama_angota.toLowerCase().includes(searchTerm.toLowerCase()) ||
            k.no_anggota.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [keuanganList, searchTerm]
    );

    const CurrencyCell: React.FC<{ amount: number; defaultColor?: string; className?: string }> = ({ amount, defaultColor = 'text-dark', className = '' }) => {
        const isNegative = amount < 0;
        const colorClass = isNegative ? 'text-red-600' : defaultColor;
        return (
            <td className={`px-4 py-4 sm:px-6 text-right ${colorClass} ${className}`}>
                {formatCurrency(amount)}
            </td>
        );
    };

    return (
        <div>
            <Header title="Laporan Keuangan" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard title="Total Simpanan Keseluruhan" value={formatCurrency(summaryData.totalSimpanan)} icon={<CreditCardIcon className="w-6 h-6 text-white" />} color="bg-green-500" />
                <StatCard title="Total Pinjaman Keseluruhan" value={formatCurrency(summaryData.totalPinjaman)} icon={<ChartBarIcon className="w-6 h-6 text-white" />} color="bg-yellow-500" />
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-lg md:text-xl font-bold text-dark">Rincian Keuangan Anggota</h2>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Cari (nama, no. anggota)..."
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-auto focus:ring-1 focus:ring-primary focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <button
                            onClick={handleDownload}
                            disabled={isDownloading || isLoading}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            {isDownloading ? 'Menyiapkan...' : 'Download Laporan'}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <p>Memuat data laporan...</p> : (
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase">
                                <tr>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200">No. Anggota</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200">Nama</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200 text-right">Simpanan Pokok</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200 text-right">Simpanan Wajib</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200 text-right">Total Simpanan</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200 text-right">Total Pinjaman</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredKeuangan.length > 0 ? filteredKeuangan.map((item) => (
                                    <tr key={item.id} className="hover:bg-primary-light transition-colors">
                                        <td className="px-4 py-4 sm:px-6 font-medium text-dark">
                                            <Link to={`/admin/keuangan/${item.no_anggota}`} className="text-primary hover:underline">
                                                {item.no_anggota}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4 sm:px-6">{item.nama_angota}</td>
                                        <CurrencyCell amount={item.akhir_simpanan_pokok} />
                                        <CurrencyCell amount={item.akhir_simpanan_wajib} />
                                        <CurrencyCell amount={item.jumlah_total_simpanan} defaultColor="text-green-600" className="font-semibold" />
                                        <CurrencyCell amount={item.jumlah_total_pinjaman} defaultColor="text-yellow-600" className="font-semibold" />
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500">
                                            Tidak ada data keuangan. Silakan unggah file data awal keuangan terlebih dahulu.
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

export default AdminLaporan;
