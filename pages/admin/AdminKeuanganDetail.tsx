import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header';
import { Keuangan } from '../../types';
import { getKeuanganByNoAnggota } from '../../services/keuanganService';
import { ChevronLeftIcon } from '../../components/icons/Icons';

const AdminKeuanganDetail: React.FC = () => {
    const { no_anggota } = useParams<{ no_anggota: string }>();
    const [data, setData] = useState<Keuangan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (no_anggota) {
                setIsLoading(true);
                const result = await getKeuanganByNoAnggota(no_anggota);
                setData(result);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [no_anggota]);

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
    
    if (isLoading) {
        return <div>Memuat rincian keuangan...</div>;
    }

    if (!data) {
        return (
             <div>
                <Header title="Data Tidak Ditemukan" />
                <p className="text-center">Data keuangan untuk anggota dengan nomor {no_anggota} tidak dapat ditemukan.</p>
                 <Link to="/admin/laporan" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
                    <ChevronLeftIcon className="w-4 h-4" />
                    Kembali ke Laporan
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <Header title={`Rincian Keuangan: ${data.nama_angota}`} />
                 <Link to="/admin/laporan" className="mb-8 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5" />
                    Kembali ke Laporan
                </Link>
            </div>
            
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

        </div>
    );
};

export default AdminKeuanganDetail;
