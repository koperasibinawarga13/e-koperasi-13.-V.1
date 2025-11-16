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
                setIsDownloading(false);
                return;
            }
    
            dataForExport.sort((a, b) => a.no_anggota.localeCompare(b.no_anggota));
    
            const header1 = [
                null, null, null,
                'KEADAAN AWAL BULAN', null, null, null, null, null,
                'TRANSAKSI BULAN INI', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                'KEADAAN AKHIR BULAN', null, null, null, null, null,
                null, null
            ];
            const header2 = [
                null, null, null,
                'SIMPANAN', null, null, null, 'PINJAMAN', null,
                'SIMPANAN', null, null, null, 'PINJAMAN', null, null, 'LAIN LAIN', null, null, 'JUMLAH', 'PENGAMBILAN SIMPANAN', null, null, null, 'PENAMBAHAN PINJAMAN', null, null,
                'SIMPANAN', null, null, null, 'PINJAMAN', null,
                null, null
            ];
            const header3 = [
                'NO', 'NO ANGGOTA', 'NAMA ANGGOTA',
                // Keadaan Awal (6)
                'POKOK', 'WAJIB', 'SUKARELA', 'WISATA', 'BERJANGKA', 'KHUSUS',
                // Transaksi (18)
                'POKOK', 'WAJIB', 'SUKARELA', 'WISATA',
                'BERJANGKA', 'KHUSUS', 'JASA',
                'NIAGA', 'KEMATIAN', 'DASOS',
                'JUMLAH',
                'POKOK', 'WAJIB', 'SUKARELA', 'WISATA',
                'BERJANGKA', 'KHUSUS', 'NIAGA',
                // Keadaan Akhir (6)
                'POKOK', 'WAJIB', 'SUKARELA', 'WISATA', 'BERJANGKA', 'KHUSUS',
                // Totals (2)
                'TOTAL SIMPANAN', 'TOTAL PINJAMAN'
            ];
    
            const dataBody = dataForExport.map((k, index) => ([
                index + 1, k.no_anggota, k.nama_angota,
                k.awal_simpanan_pokok, k.awal_simpanan_wajib, k.sukarela, k.awal_simpanan_wisata, k.awal_pinjaman_berjangka, k.awal_pinjaman_khusus,
                k.transaksi_simpanan_pokok, k.transaksi_simpanan_wajib, k.transaksi_simpanan_sukarela, k.transaksi_simpanan_wisata,
                k.transaksi_pinjaman_berjangka, k.transaksi_pinjaman_khusus, k.transaksi_simpanan_jasa,
                k.transaksi_niaga, k.transaksi_dana_perlaya, k.transaksi_dana_katineng,
                k.Jumlah_setoran,
                k.transaksi_pengambilan_simpanan_pokok, k.transaksi_pengambilan_simpanan_wajib, k.transaksi_pengambilan_simpanan_sukarela, k.transaksi_pengambilan_simpanan_wisata,
                k.transaksi_penambahan_pinjaman_berjangka, k.transaksi_penambahan_pinjaman_khusus, k.transaksi_penambahan_pinjaman_niaga,
                k.akhir_simpanan_pokok, k.akhir_simpanan_wajib, k.akhir_simpanan_sukarela, k.akhir_simpanan_wisata,
                k.akhir_pinjaman_berjangka, k.akhir_pinjaman_khusus,
                k.jumlah_total_simpanan, k.jumlah_total_pinjaman
            ]));
    
            const worksheetData = [
                ['Laporan Koperasi Periode', reportPeriod],
                [], // Empty row for spacing
                header1, 
                header2, 
                header3, 
                ...dataBody
            ];

            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
            worksheet['!merges'] = [
                // Merged Title
                { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, 
                // Main Table Merges (shifted down by 2 rows)
                { s: { r: 2, c: 0 }, e: { r: 4, c: 0 } },   // NO
                { s: { r: 2, c: 1 }, e: { r: 4, c: 1 } },   // NO ANGGOTA
                { s: { r: 2, c: 2 }, e: { r: 4, c: 2 } },   // NAMA ANGGOTA
                { s: { r: 2, c: 33 }, e: { r: 4, c: 33 } }, // TOTAL SIMPANAN
                { s: { r: 2, c: 34 }, e: { r: 4, c: 34 } }, // TOTAL PINJAMAN
                { s: { r: 2, c: 3 }, e: { r: 2, c: 8 } },   // KEADAAN AWAL BULAN
                { s: { r: 3, c: 3 }, e: { r: 3, c: 6 } },   // SIMPANAN (AWAL)
                { s: { r: 3, c: 7 }, e: { r: 3, c: 8 } },   // PINJAMAN (AWAL)
                { s: { r: 2, c: 9 }, e: { r: 2, c: 26 } },  // TRANSAKSI BULAN INI
                { s: { r: 3, c: 9 }, e: { r: 3, c: 12 } },  // SIMPANAN (TX)
                { s: { r: 3, c: 13 }, e: { r: 3, c: 15 } }, // PINJAMAN (TX)
                { s: { r: 3, c: 16 }, e: { r: 3, c: 18 } }, // LAIN LAIN (TX)
                { s: { r: 3, c: 19 }, e: { r: 4, c: 19 } }, // JUMLAH (TX)
                { s: { r: 3, c: 20 }, e: { r: 3, c: 23 } }, // PENGAMBILAN SIMPANAN (TX)
                { s: { r: 3, c: 24 }, e: { r: 3, c: 26 } }, // PENAMBAHAN PINJAMAN (TX)
                { s: { r: 2, c: 27 }, e: { r: 2, c: 32 } }, // KEADAAN AKHIR BULAN
                { s: { r: 3, c: 27 }, e: { r: 3, c: 30 } }, // SIMPANAN (AKHIR)
                { s: { r: 3, c: 31 }, e: { r: 3, c: 32 } }, // PINJAMAN (AKHIR)
            ];

            worksheet['!cols'] = [
                { wch: 5 }, { wch: 15 }, { wch: 30 }, // NO, NO ANGGOTA, NAMA
                ...Array(32).fill({ wch: 15 }) // All other data columns
            ];
    
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan ${reportPeriod}`);
            const today = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `Laporan_Koperasi_${reportPeriod.replace(/ /g, '_')}_${today}.xlsx`);
    
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
        const colorClass = isNegative ? 'text-red-500' : defaultColor;
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
                <StatCard title="Total Simpanan Keseluruhan" value={formatCurrency(summaryData.totalSimpanan)} icon={<CreditCardIcon className="w-6 h-6" />} iconBgColor="bg-teal-500" />
                <StatCard title="Total Pinjaman Keseluruhan" value={formatCurrency(summaryData.totalPinjaman)} icon={<ChartBarIcon className="w-6 h-6" />} iconBgColor="bg-amber-500" />
            </div>

            <div className="bg-surface p-6 rounded-xl border border-slate-200">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-lg md:text-xl font-bold text-dark">Rincian Keuangan Anggota</h2>
                    <div className="flex flex-wrap items-center gap-4">
                        <input
                            type="text"
                            placeholder="Cari (nama, no. anggota)..."
                            className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 w-full sm:w-auto focus:ring-1 focus:ring-primary focus:border-primary text-dark"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 w-full sm:w-auto focus:ring-1 focus:ring-primary focus:border-primary text-dark"
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
                            className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 w-full sm:w-auto focus:ring-1 focus:ring-primary focus:border-primary text-dark"
                            disabled={isLoading}
                        >
                             {availableMonths.length > 0 ? availableMonths.map(renderMonthOption) : <option>Memuat...</option>}
                        </select>
                         <button
                            onClick={handleDownload}
                            disabled={isDownloading || isLoading}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            {isDownloading ? 'Menyiapkan...' : 'Download Laporan'}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <p>Memuat data laporan...</p> : (
                        <table className="w-full text-sm text-left text-gray-text">
                            <thead className="text-xs text-gray-text uppercase">
                                <tr>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-slate-200">No. Anggota</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-slate-200">Nama</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-slate-200 text-right">Simpanan Pokok</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-slate-200 text-right">Simpanan Wajib</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-slate-200 text-right">Total Simpanan</th>
                                    <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-slate-200 text-right">Total Pinjaman</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredKeuangan.length > 0 ? filteredKeuangan.map((item) => (
                                    <tr key={item.no_anggota} className="hover:bg-primary-light/50 transition-colors">
                                        <td className="px-4 py-4 sm:px-6 font-medium text-dark">
                                            <Link to={`/admin/keuangan/${item.no_anggota}`} className="text-primary hover:underline">
                                                {item.no_anggota}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4 sm:px-6">{item.nama_angota}</td>
                                        <CurrencyCell amount={item.akhir_simpanan_pokok} />
                                        <CurrencyCell amount={item.akhir_simpanan_wajib} />
                                        <CurrencyCell amount={item.jumlah_total_simpanan} defaultColor="text-green-600" className="font-semibold" />
                                        <CurrencyCell amount={item.jumlah_total_pinjaman} defaultColor="text-amber-600" className="font-semibold" />
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-text">
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