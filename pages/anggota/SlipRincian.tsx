import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getKeuanganByNoAnggota } from '../../services/keuanganService';
import { getAnggotaById } from '../../services/anggotaService';
import { Keuangan, Anggota } from '../../types';
import { PrintIcon, ChevronLeftIcon } from '../../components/icons/Icons';

const SlipRincian: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [keuangan, setKeuangan] = useState<Keuangan | null>(null);
    const [anggota, setAnggota] = useState<Anggota | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.anggotaId) {
                try {
                    const anggotaData = await getAnggotaById(user.anggotaId);
                    setAnggota(anggotaData);
                    if (anggotaData?.no_anggota) {
                        const keuanganData = await getKeuanganByNoAnggota(anggotaData.no_anggota);
                        setKeuangan(keuanganData);
                    }
                } catch (error) {
                    console.error("Failed to fetch slip data:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false); // No user, stop loading
            }
        };
        fetchData();
    }, [user]);

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number' || isNaN(amount) || amount === 0) return '-';
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Memuat slip...</div>;
    }

    if (!keuangan || !anggota) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">Gagal Memuat Data</h2>
                <p>Data keuangan atau anggota tidak ditemukan.</p>
                <button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
                    <ChevronLeftIcon className="w-4 h-4" />
                    Kembali
                </button>
            </div>
        );
    }
    
    // Helper Components for the new layout
    const Section: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => (
        <div className="mb-4">
            <h3 className={`p-2 rounded-md text-center font-bold text-sm tracking-wider ${color}`}>
                {title}
            </h3>
            <div className="mt-2 px-2 space-y-1">
                {children}
            </div>
        </div>
    );

    const Item: React.FC<{ label: string; value: number | undefined }> = ({ label, value }) => {
        const isNegative = typeof value === 'number' && value < 0;
        const formattedValue = formatCurrency(value);
        return (
            <div className="flex justify-between items-start text-sm py-1 font-mono">
                <span className="text-gray-700 mr-2">- {label}</span>
                <div className="flex items-baseline flex-shrink-0">
                    <span className="text-gray-500 mr-1">Rp</span>
                    <span className={`text-right w-24 font-semibold ${isNegative ? 'text-red-600' : 'text-dark'}`}>{formattedValue}</span>
                </div>
            </div>
        );
    };
    
    const TotalItem: React.FC<{ label: string; value: number | undefined; color: string }> = ({ label, value, color }) => {
        const isNegative = typeof value === 'number' && value < 0;
        const containerClass = `flex justify-between items-center p-2 rounded-md font-bold text-sm ${isNegative ? 'bg-red-100 text-red-800' : color}`;
        return (
            <div className={containerClass}>
                <span>{label}</span>
                <div className="flex items-baseline flex-shrink-0 font-mono">
                    <span className="opacity-80 mr-1">Rp</span>
                    <span className="text-right w-24">{formatCurrency(value)}</span>
                </div>
            </div>
        );
    };


    return (
        <div className="bg-background min-h-screen font-sans">
            <div className="max-w-4xl mx-auto p-4 print:hidden">
                 <div className="flex justify-between items-center mb-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50">
                        <ChevronLeftIcon className="w-5 h-5" />
                        Kembali
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-primary-dark">
                        <PrintIcon className="w-5 h-5" />
                        Cetak
                    </button>
                </div>
            </div>

            <div id="slip-content" className="max-w-4xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow-lg print:shadow-none print:p-2">
                <div className="border-b-2 border-black pb-2 mb-4">
                    <h2 className="text-lg font-bold">Nama Anggota: {anggota.nama}</h2>
                    <p className="text-sm text-gray-500">No. Anggota: {anggota.no_anggota}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    {/* Left Column */}
                    <div>
                        <Section title="KEADAAN AWAL BULAN" color="bg-blue-100 text-blue-800">
                            <Item label="Simpanan Pokok" value={keuangan.awal_simpanan_pokok} />
                            <Item label="Simpanan Wajib" value={keuangan.awal_simpanan_wajib} />
                            <Item label="Simpanan Sukarela" value={keuangan.sukarela} />
                            <Item label="Simpanan Wisata" value={keuangan.awal_simpanan_wisata} />
                            <Item label="Pinjaman Berjangka" value={keuangan.awal_pinjaman_berjangka} />
                            <Item label="Pinjaman Khusus" value={keuangan.awal_pinjaman_khusus} />
                        </Section>
                        
                        <Section title="KEADAAN AKHIR BULAN" color="bg-blue-100 text-blue-800">
                            <Item label="Simpanan Pokok" value={keuangan.akhir_simpanan_pokok} />
                            <Item label="Simpanan Wajib" value={keuangan.akhir_simpanan_wajib} />
                            <Item label="Simpanan Sukarela" value={keuangan.akhir_simpanan_sukarela} />
                            <Item label="Simpanan Wisata" value={keuangan.akhir_simpanan_wisata} />
                            <Item label="Pinjaman Berjangka" value={keuangan.akhir_pinjaman_berjangka} />
                            <Item label="Pinjaman Khusus" value={keuangan.akhir_pinjaman_khusus} />
                        </Section>
                    </div>

                    {/* Right Column */}
                    <div>
                         <Section title="PENGAMBILAN SIMPANAN" color="bg-rose-100 text-rose-800">
                            <Item label="Simpanan Pokok" value={keuangan.transaksi_pengambilan_simpanan_pokok} />
                            <Item label="Simpanan Wajib" value={keuangan.transaksi_pengambilan_simpanan_wajib} />
                            <Item label="Simpanan Sukarela" value={keuangan.transaksi_pengambilan_simpanan_sukarela} />
                            <Item label="Simpanan Wisata" value={keuangan.transaksi_pengambilan_simpanan_wisata} />
                        </Section>

                        <Section title="PENAMBAHAN PINJAMAN" color="bg-rose-100 text-rose-800">
                             <Item label="Pinjaman Berjangka" value={keuangan.transaksi_penambahan_pinjaman_berjangka} />
                             <Item label="Pinjaman Khusus" value={keuangan.transaksi_penambahan_pinjaman_khusus} />
                             <Item label="Pinjaman Niaga" value={keuangan.transaksi_penambahan_pinjaman_niaga} />
                        </Section>
                        
                        <Section title="SETORAN BULAN INI" color="bg-rose-100 text-rose-800">
                            <Item label="Simpanan Pokok" value={keuangan.transaksi_simpanan_pokok} />
                            <Item label="Simpanan Wajib" value={keuangan.transaksi_simpanan_wajib} />
                            <Item label="Simpanan Sukarela" value={keuangan.transaksi_simpanan_sukarela} />
                            <Item label="Simpanan Wisata" value={keuangan.transaksi_simpanan_wisata} />
                            <Item label="Angsuran P. Berjangka" value={keuangan.transaksi_pinjaman_berjangka} />
                            <Item label="Angsuran P. Khusus" value={keuangan.transaksi_pinjaman_khusus} />
                            <Item label="Jasa" value={keuangan.transaksi_simpanan_jasa} />
                            <Item label="Niaga" value={keuangan.transaksi_niaga} />
                            <Item label="Dana Perlaya" value={keuangan.transaksi_dana_perlaya} />
                            <Item label="Dana Katineng" value={keuangan.transaksi_dana_katineng} />
                        </Section>
                        
                        <div className="px-2 mt-2">
                             <TotalItem label="JUMLAH SETORAN" value={keuangan.Jumlah_setoran} color="bg-gray-800 text-white" />
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @media print {
                    body {
                        background-color: white;
                    }
                    .print\\:hidden {
                        display: none;
                    }
                    .print\\:shadow-none {
                        box-shadow: none;
                    }
                     .print\\:p-2 {
                        padding: 0.5rem;
                    }
                    #slip-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default SlipRincian;
