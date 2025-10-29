import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { CreditCardIcon, ChartBarIcon, DownloadIcon } from '../../components/icons/Icons';
import { getKeuangan, getUploadedMonths, getLaporanBulananForAll } from '../../services/keuanganService';
import { Keuangan } from '../../types';

const AdminLaporan: React.FC = () => {
    const [keuanganList, setKeuanganList] = useState<Keuangan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('latest');
    const [sortOption, setSortOption] = useState('no_anggota_asc');


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [data, months] = await Promise.all([
                getKeuangan(),
                getUploadedMonths()
            ]);
            // Default sort data by no_anggota in ascending order
            const sortedData = data.sort((a, b) => a.no_anggota.localeCompare(b.no_anggota));
            setKeuanganList(sortedData);
            setAvailableMonths(['latest', ...months]);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };
    
    const generateExportData = (list: Keuangan[]) => {
        return list.map(k => ({
            'No Anggota': k.no_anggota,
            'Nama': k.nama_angota,
            'Periode Laporan': k.periode || '',
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
    };
    
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            let dataForExport: Keuangan[] = [];
            let reportPeriod = 'Terkini';

            if (selectedMonth === 'latest') {
                dataForExport = keuanganList;
            } else {
                dataForExport = await getLaporanBulananForAll(selectedMonth);
                reportPeriod = new Date(`${selectedMonth}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            }

            if (dataForExport.length === 0) {
                alert('Tidak ada data untuk diunduh pada periode yang dipilih.');
                return;
            }
            
            dataForExport.sort((a, b) => a.no_anggota.localeCompare(b.no_anggota));
            
            const processedData = generateExportData(dataForExport);
            const worksheet = XLSX.utils.json_to_sheet(processedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan ${reportPeriod}`);
            
            const today = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `Laporan_Koperasi_${reportPeriod.replace(' ', '_')}_${today}.xlsx`);

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

    const sortedList = useMemo(() => {
        const sortableList = [...keuanganList]; // Create a copy to avoid mutating state
        switch (sortOption) {
            case 'no_anggota_asc':
                return sortableList.sort((a, b) => a.no_anggota.localeCompare(b.no_anggota));
            case 'no_anggota_desc':
                return sortableList.sort((a, b) => b.no_anggota.localeCompare(a.no_anggota));
            case 'nama_asc':
                return sortableList.sort((a, b) => a.nama_angota.localeCompare(b.nama_angota));
            case 'nama_desc':
                return sortableList.sort((a, b) => b.nama_angota.localeCompare(a.nama_angota));
            case 'simpanan_desc':
                return sortableList.sort((a, b) => b.jumlah_total_simpanan - a.jumlah_total_simpanan);
            case 'simpanan_asc':
                return sortableList.sort((a, b) => a.jumlah_total_simpanan - b.jumlah_total_simpanan);
            case 'pinjaman_desc':
                return sortableList.sort((a, b) => b.jumlah_total_pinjaman - a.jumlah_total_pinjaman);
            case 'pinjaman_asc':
                return sortableList.sort((a, b) => a.jumlah_total_pinjaman - b.jumlah_total_pinjaman);
            default:
                return sortableList;
        }
    }, [keuanganList, sortOption]);
    
    const filteredKeuangan = useMemo(() =>
        sortedList.filter(k =>
            k.nama_angota.toLowerCase().includes(searchTerm.toLowerCase()) ||
            k.no_anggota.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [sortedList, searchTerm]
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

    const renderMonthOption = (month: string) => {
        if (month === 'latest') {
            return <option key="latest" value="latest">Laporan Terkini</option>;
        }
        return (
            <option key={month} value={month}>
                Laporan {new Date(`${month}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </option>
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
                    <div className="flex flex-wrap items-center gap-4">
                        <input
                            type="text"
                            placeholder="Cari (nama, no. anggota)..."
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-auto focus:ring-1 focus:ring-primary focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-auto focus:ring-1 focus:ring-primary focus:border-primary bg-surface"
                        >
                            <option value="no_anggota_asc">Urutkan No. Anggota (A-Z)</option>
                            <option value="no_anggota_desc">Urutkan No. Anggota (Z-A)</option>
                            <option value="nama_asc">Urutkan Nama (A-Z)</option>
                            <option value="nama_desc">Urutkan Nama (Z-A)</option>
                            <option value="simpanan_desc">Simpanan Tertinggi</option>
                            <option value="simpanan_asc">Simpanan Terendah</option>
                            <option value="pinjaman_desc">Pinjaman Tertinggi</option>
                            <option value="pinjaman_asc">Pinjaman Terendah</option>
                        </select>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-auto focus:ring-1 focus:ring-primary focus:border-primary bg-surface"
                            disabled={isLoading}
                        >
                             {availableMonths.length > 0 ? availableMonths.map(renderMonthOption) : <option>Memuat...</option>}
                        </select>
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
                                    <tr key={item.no_anggota} className="hover:bg-primary-light transition-colors">
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
                                            Tidak ada data keuangan yang cocok dengan pencarian Anda.
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