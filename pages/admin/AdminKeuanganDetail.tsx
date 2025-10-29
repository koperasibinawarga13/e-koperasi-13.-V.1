import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header';
import { Keuangan } from '../../types';
import { getKeuanganByNoAnggota, getAvailableLaporanMonths, getLaporanBulanan } from '../../services/keuanganService';
import { ChevronLeftIcon } from '../../components/icons/Icons';

const AdminKeuanganDetail: React.FC = () => {
    const { no_anggota } = useParams<{ no_anggota: string }>();
    const [data, setData] = useState<Keuangan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('latest');

    useEffect(() => {
        const fetchMonths = async () => {
            if (no_anggota) {
                const months = await getAvailableLaporanMonths(no_anggota);
                setAvailableMonths(['latest', ...months]);
            }
        };
        fetchMonths();
    }, [no_anggota]);

    useEffect(() => {
        const fetchData = async () => {
            if (no_anggota) {
                setIsLoading(true);
                let result: Keuangan | null = null;
                if (selectedMonth === 'latest') {
                    result = await getKeuanganByNoAnggota(no_anggota);
                } else {
                    result = await getLaporanBulanan(no_anggota, selectedMonth);
                }
                setData(result);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [no_anggota, selectedMonth]);

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const renderMonthOption = (month: string) => {
        if (month === 'latest') {
            return <option key="latest" value="latest">Laporan Terkini</option>;
        }
        return (
            <option key={month} value={month}>
                {new Date(`${month}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </option>
        );
    };

    const getPageTitle = () => {
        if (!data) return "Rincian Keuangan";
        let title = `Rincian Keuangan: ${data.nama_angota}`;
        if (selectedMonth !== 'latest' && data.periode) {
             title += ` (${new Date(`${data.periode}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`;
        }
        return title;
    };


    const DetailCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h3 className="text-xl font-bold text-dark border-b pb-3 mb-4">{title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                {children}
            </div>
        </div>
    );

    const InfoItem: React.FC<{ label: string; value: string | number; isCurrency?: boolean }> = ({ label, value, isCurrency = true }) => {
        const isNegative = typeof value === 'number' && value < 0;
        return (
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`font-semibold ${isNegative ? 'text-red-600' : 'text-dark'}`}>{isCurrency ? formatCurrency(value as number) : value}</p>
            </div>
        );
    };
    
    if (isLoading && !data) { // Show initial loading screen
        return <div className="p-8 text-center">Memuat rincian keuangan...</div>;
    }

    if (!data) {
        return (
             <div>
                <Header title="Data Tidak Ditemukan" />
                <div className="p-8 text-center">
                    <p>Data keuangan untuk anggota dengan nomor {no_anggota} tidak dapat ditemukan.</p>
                    <Link to="/admin/laporan" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
                        <ChevronLeftIcon className="w-4 h-4" />
                        Kembali ke Laporan
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-white shadow-sm p-4 rounded-lg mb-6 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-lg sm:text-xl font-bold text-dark">{getPageTitle()}</h1>
                <div className="flex items-center gap-4">
                    <select
                        id="month-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-48 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        disabled={isLoading || availableMonths.length <= 1}
                    >
                        {(availableMonths.length > 0) ? 
                            availableMonths.map(renderMonthOption)
                            : <option>Memuat...</option>
                        }
                    </select>
                    <Link to="/admin/laporan" className="inline-flex items-center gap-2 text-sm font-medium bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <ChevronLeftIcon className="w-5 h-5" />
                        Kembali
                    </Link>
                </div>
            </div>

            {isLoading ? <div className="text-center p-10">Memuat data periode...</div> : (
            <>
                <DetailCard title="Saldo Awal">
                    <InfoItem label="Simpanan Pokok" value={data.awal_simpanan_pokok} />
                    <InfoItem label="Simpanan Wajib" value={data.awal_simpanan_wajib} />
                    <InfoItem label="Simpanan Sukarela" value={data.sukarela} />
                    <InfoItem label="Simpanan Wisata" value={data.awal_simpanan_wisata} />
                    <InfoItem label="Pinjaman Berjangka" value={data.awal_pinjaman_berjangka} />
                    <InfoItem label="Pinjaman Khusus" value={data.awal_pinjaman_khusus} />
                </DetailCard>

                <DetailCard title="Transaksi Bulan Ini (Setoran)">
                     <InfoItem label="Simpanan Pokok" value={data.transaksi_simpanan_pokok} />
                     <InfoItem label="Simpanan Wajib" value={data.transaksi_simpanan_wajib} />
                     <InfoItem label="Simpanan Sukarela" value={data.transaksi_simpanan_sukarela} />
                     <InfoItem label="Simpanan Wisata" value={data.transaksi_simpanan_wisata} />
                     <InfoItem label="Angsuran Pinjaman Berjangka" value={data.transaksi_pinjaman_berjangka} />
                     <InfoItem label="Angsuran Pinjaman Khusus" value={data.transaksi_pinjaman_khusus} />
                     <InfoItem label="Jasa" value={data.transaksi_simpanan_jasa} />
                     <InfoItem label="Niaga" value={data.transaksi_niaga} />
                     <InfoItem label="Dana Perlaya" value={data.transaksi_dana_perlaya} />
                     <InfoItem label="Dana Katineng" value={data.transaksi_dana_katineng} />
                     <InfoItem label="Jumlah Setoran" value={data.Jumlah_setoran} />
                </DetailCard>
                
                <DetailCard title="Transaksi Bulan Ini (Pengambilan & Penambahan)">
                     <InfoItem label="Pengambilan Simpanan Pokok" value={data.transaksi_pengambilan_simpanan_pokok} />
                     <InfoItem label="Pengambilan Simpanan Wajib" value={data.transaksi_pengambilan_simpanan_wajib} />
                     <InfoItem label="Pengambilan Simpanan Sukarela" value={data.transaksi_pengambilan_simpanan_sukarela} />
                     <InfoItem label="Pengambilan Simpanan Wisata" value={data.transaksi_pengambilan_simpanan_wisata} />
                     <InfoItem label="Penambahan Pinjaman Berjangka" value={data.transaksi_penambahan_pinjaman_berjangka} />
                     <InfoItem label="Penambahan Pinjaman Khusus" value={data.transaksi_penambahan_pinjaman_khusus} />
                     <InfoItem label="Penambahan Pinjaman Niaga" value={data.transaksi_penambahan_pinjaman_niaga} />
                </DetailCard>

                <DetailCard title="Saldo Akhir">
                     <InfoItem label="Simpanan Pokok" value={data.akhir_simpanan_pokok} />
                     <InfoItem label="Simpanan Wajib" value={data.akhir_simpanan_wajib} />
                     <InfoItem label="Simpanan Sukarela" value={data.akhir_simpanan_sukarela} />
                     <InfoItem label="Simpanan Wisata" value={data.akhir_simpanan_wisata} />
                     <InfoItem label="Pinjaman Berjangka" value={data.akhir_pinjaman_berjangka} />
                     <InfoItem label="Pinjaman Khusus" value={data.akhir_pinjaman_khusus} />
                     <InfoItem label="Total Simpanan" value={data.jumlah_total_simpanan} />
                     <InfoItem label="Total Pinjaman" value={data.jumlah_total_pinjaman} />
                </DetailCard>
            </>
            )}
        </div>
    );
};

export default AdminKeuanganDetail;