import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { Keuangan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getAnggotaById } from '../../services/anggotaService';
import { getLaporanBulanan, getAvailableLaporanMonths } from '../../services/keuanganService';
import { PrintIcon } from '../../components/icons/Icons';

const AnggotaKeuangan: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<Keuangan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('');


    useEffect(() => {
        const fetchInitialData = async () => {
            if (user?.anggotaId) {
                setIsLoading(true);
                const anggota = await getAnggotaById(user.anggotaId);
                if (anggota?.no_anggota) {
                    const months = await getAvailableLaporanMonths(anggota.no_anggota);
                    setAvailableMonths(months);
                    if (months.length > 0) {
                        setSelectedMonth(months[0]); // Automatically select the latest month
                    } else {
                        setIsLoading(false); // No history, stop loading
                    }
                } else {
                     setIsLoading(false);
                }
            } else {
                 setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [user]);

    useEffect(() => {
        const fetchDataForMonth = async () => {
            if (user?.anggotaId && selectedMonth) {
                setIsLoading(true);
                 try {
                    const anggota = await getAnggotaById(user.anggotaId);
                    if (anggota?.no_anggota) {
                        const result = await getLaporanBulanan(anggota.no_anggota, selectedMonth);
                        setData(result);
                    }
                } catch (error) {
                    console.error(`Failed to fetch data for month ${selectedMonth}:`, error);
                    setData(null);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        
        if (selectedMonth) {
            fetchDataForMonth();
        }
    }, [user, selectedMonth]);


    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const DetailCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h3 className="text-xl font-bold text-dark border-b pb-3 mb-4">{title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                {children}
            </div>
        </div>
    );

    const InfoItem: React.FC<{ label: string; value: string | number; isCurrency?: boolean }> = ({ label, value, isCurrency = true }) => (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-dark">{isCurrency ? formatCurrency(value as number) : value}</p>
        </div>
    );
    
    if (isLoading && !data) {
        return (
            <div>
                <Header title="Rincian Keuangan" />
                <p className="text-center p-10">Memuat rincian keuangan...</p>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Header title="Rincian Keuangan" />
                 <div className="flex items-center gap-4 mb-8">
                    <div>
                        <label htmlFor="month-select" className="text-sm font-medium text-gray-700 sr-only">Pilih Bulan</label>
                        <select
                            id="month-select"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-48 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                            disabled={isLoading || availableMonths.length === 0}
                        >
                            {availableMonths.length > 0 ? (
                                availableMonths.map(month => (
                                <option key={month} value={month}>
                                    {new Date(`${month}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                </option>
                                ))
                            ) : (
                                <option>Tidak ada riwayat</option>
                            )}
                        </select>
                    </div>
                    <Link to="/anggota/slip" state={{ slipData: data }} className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        <PrintIcon className="w-5 h-5 text-gray-600" />
                        Cetak Slip
                    </Link>
                 </div>
            </div>
            
            {!data && !isLoading ? (
                <p className="text-center p-10">Data keuangan tidak ditemukan. Silakan hubungi admin jika terjadi kesalahan.</p>
            ) : (
            <>
                <DetailCard title="Saldo Awal">
                    <InfoItem label="Simpanan Pokok" value={data.awal_simpanan_pokok} />
                    <InfoItem label="Simpanan Wajib" value={data.awal_simpanan_wajib} />
                    <InfoItem label="Simpanan Sukarela" value={data.sukarela} />
                    <InfoItem label="Simpanan Wisata" value={data.awal_simpanan_wisata} />
                    <InfoItem label="Pinjaman Berjangka" value={data.awal_pinjaman_berjangka} />
                    <InfoItem label="Pinjaman Khusus" value={data.awal_pinjaman_khusus} />
                </DetailCard>

                <DetailCard title="Transaksi Bulan Ini (Setoran & Penambahan)">
                    <InfoItem label="Simpanan Pokok" value={data.transaksi_simpanan_pokok} />
                    <InfoItem label="Simpanan Wajib" value={data.transaksi_simpanan_wajib} />
                    <InfoItem label="Simpanan Sukarela" value={data.transaksi_simpanan_sukarela} />
                    <InfoItem label="Simpanan Wisata" value={data.transaksi_simpanan_wisata} />
                    <InfoItem label="Jasa" value={data.transaksi_simpanan_jasa} />
                    <InfoItem label="Niaga" value={data.transaksi_niaga} />
                    <InfoItem label="Dana Perlaya" value={data.transaksi_dana_perlaya} />
                    <InfoItem label="Dana Katineng" value={data.transaksi_dana_katineng} />
                    <InfoItem label="Jumlah Setoran" value={data.Jumlah_setoran} />
                    <InfoItem label="Penambahan Pinjaman Berjangka" value={data.transaksi_penambahan_pinjaman_berjangka} />
                    <InfoItem label="Penambahan Pinjaman Khusus" value={data.transaksi_penambahan_pinjaman_khusus} />
                    <InfoItem label="Penambahan Pinjaman Niaga" value={data.transaksi_penambahan_pinjaman_niaga} />
                </DetailCard>
                
                <DetailCard title="Transaksi Bulan Ini (Pengambilan & Angsuran)">
                    <InfoItem label="Pengambilan Simpanan Pokok" value={data.transaksi_pengambilan_simpanan_pokok} />
                    <InfoItem label="Pengambilan Simpanan Wajib" value={data.transaksi_pengambilan_simpanan_wajib} />
                    <InfoItem label="Pengambilan Simpanan Sukarela" value={data.transaksi_pengambilan_simpanan_sukarela} />
                    <InfoItem label="Pengambilan Simpanan Wisata" value={data.transaksi_pengambilan_simpanan_wisata} />
                    <InfoItem label="Angsuran Pinjaman Berjangka" value={data.transaksi_pinjaman_berjangka} />
                    <InfoItem label="Angsuran Pinjaman Khusus" value={data.transaksi_pinjaman_khusus} />
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

export default AnggotaKeuangan;