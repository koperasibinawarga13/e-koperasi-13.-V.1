import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Keuangan, Anggota } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getAnggotaById } from '../../services/anggotaService';
import { getLaporanBulanan, getAvailableLaporanMonths, getKeuanganByNoAnggota } from '../../services/keuanganService';
import { PrintIcon, UserCircleIcon } from '../../components/icons/Icons';

const AnggotaKeuangan: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<Keuangan | null>(null);
    const [anggota, setAnggota] = useState<Anggota | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('latest'); // Default to 'latest'

    // Effect to fetch initial metadata (anggota and available months)
    useEffect(() => {
        const fetchInitialData = async () => {
            if (user?.anggotaId) {
                try {
                    const anggotaData = await getAnggotaById(user.anggotaId);
                    setAnggota(anggotaData);
                    if (anggotaData?.no_anggota) {
                        const months = await getAvailableLaporanMonths(anggotaData.no_anggota);
                        setAvailableMonths(['latest', ...months]); // Add 'latest' as the first option
                    }
                } catch (error) {
                    console.error("Error fetching initial data:", error);
                }
            } else {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [user]);

    // Effect to fetch financial data based on selected month
    useEffect(() => {
        const fetchDataForMonth = async () => {
            if (!anggota?.no_anggota) return;

            setIsLoading(true);
            try {
                let result: Keuangan | null = null;
                if (selectedMonth === 'latest') {
                    result = await getKeuanganByNoAnggota(anggota.no_anggota);
                } else {
                    result = await getLaporanBulanan(anggota.no_anggota, selectedMonth);
                }
                setData(result);
            } catch (error) {
                console.error(`Failed to fetch data for selection ${selectedMonth}:`, error);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (anggota) { // Only run if we have the member's info
            fetchDataForMonth();
        }
    }, [anggota, selectedMonth]);

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

    const DetailCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-dark border-b pb-3 mb-4">{title}</h3>
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
    
    return (
        <div>
            {/* Custom Header Section */}
            <div className="bg-white shadow-sm p-6 rounded-lg mb-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark">Rincian Keuangan</h1>
                    {anggota && (
                        <div className="hidden md:flex items-center space-x-2 text-gray-600 border-l pl-3 ml-1">
                            <UserCircleIcon className="w-6 h-6 text-gray-400" />
                            <span className="font-medium">{anggota.nama}</span>
                        </div>
                    )}
                </div>
                 <div className="flex items-center gap-4">
                    <div>
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
                    </div>
                    <Link 
                        to="/anggota/slip" 
                        state={{ slipData: data }} 
                        className={`inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors ${!data ? 'pointer-events-none opacity-50' : ''}`}
                        aria-disabled={!data}
                    >
                        <PrintIcon className="w-5 h-5 text-gray-600" />
                        Cetak Slip
                    </Link>
                 </div>
            </div>

            {isLoading && (
                 <p className="text-center p-10">Memuat rincian keuangan...</p>
            )}
            
            {!isLoading && !data && (
                <p className="text-center p-10">Data keuangan tidak ditemukan. Silakan hubungi admin jika terjadi kesalahan.</p>
            )}

            {!isLoading && data && (
            <>
                <DetailCard title="Saldo Awal">
                    <InfoItem label="Simpanan Pokok" value={data.awal_simpanan_pokok} />
                    <InfoItem label="Simpanan Wajib" value={data.awal_simpanan_wajib} />
                    <InfoItem label="Simpanan Sukarela" value={data.sukarela} />
                    <InfoItem label="Simpanan Wisata" value={data.awal_simpanan_wisata} />
                    <InfoItem label="Pinjaman Berjangka" value={data.awal_pinjaman_berjangka} />
                    <InfoItem label="Pinjaman Khusus" value={data.awal_pinjaman_khusus} />
                    <InfoItem label="Pinjaman Niaga" value={data.awal_pinjaman_niaga} />
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
                    <InfoItem label="Pinjaman Niaga" value={data.akhir_pinjaman_niaga} />
                    <InfoItem label="Total Simpanan" value={data.jumlah_total_simpanan} />
                    <InfoItem label="Total Pinjaman" value={data.jumlah_total_pinjaman} />
                </DetailCard>
             </>
            )}
        </div>
    );
};

export default AnggotaKeuangan;