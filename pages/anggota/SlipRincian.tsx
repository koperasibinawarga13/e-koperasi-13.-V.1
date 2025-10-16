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
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Automatically trigger print dialog after a short delay to allow rendering
    useEffect(() => {
        if (!isLoading && keuangan && anggota) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading, keuangan, anggota]);

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number' || isNaN(amount) || amount === 0) return '-';
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    const slipDate = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());

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
    
    const SlipRow: React.FC<{ label: string; value: number | undefined; isEqual?: boolean }> = ({ label, value, isEqual = false }) => (
        <div className="flex justify-between items-baseline text-xs mb-1">
            <span className="truncate pr-2">{isEqual ? '=' : '-'} {label}</span>
            <div className="flex items-baseline flex-shrink-0">
                <span>Rp</span>
                <span className="w-24 text-right">{formatCurrency(value)}</span>
            </div>
        </div>
    );
    
    const SlipSection: React.FC<{title: string, children: React.ReactNode, bgColor?: string}> = ({title, children, bgColor = 'bg-gray-100'}) => (
        <section className="mb-3">
            <h3 className={`font-bold text-xs p-1 ${bgColor} text-black text-center tracking-wider`}>{title}</h3>
            <div className="pt-2 px-1">
                {children}
            </div>
        </section>
    );

    return (
        <div className="bg-gray-100 min-h-screen font-mono print:bg-white">
            <div className="max-w-md mx-auto p-4 flex justify-between items-center print:hidden">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 font-sans">
                    <ChevronLeftIcon className="w-5 h-5" />
                    Kembali
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-primary-dark font-sans">
                    <PrintIcon className="w-5 h-5" />
                    Cetak Ulang
                </button>
            </div>

            <div id="slip-content" className="max-w-md mx-auto bg-white p-4 border text-black print:p-2 print:border-none print:shadow-none">
                <header className="text-center pb-2 border-t-2 border-b-4 border-black">
                    <h1 className="font-bold text-sm">KOPERASI BINA WARGA</h1>
                    <h2 className="font-bold text-sm">SMP NEGERI 13 TASIKMALAYA</h2>
                    <p className="text-xs">Jln Letjend H. Ibrahim Adjie Km2. Indihiang Tasikmalaya</p>
                </header>

                <section className="my-3 text-xs">
                    <div className="flex justify-between items-start">
                        <div className="grid grid-cols-[auto,1fr] gap-x-2">
                           <span className="font-bold">No Anggota</span>   <span>: {anggota.no_anggota}</span>
                           <span className="font-bold">Nama Anggota</span> <span>: {anggota.nama}</span>
                        </div>
                        <div className="text-right">
                           <p>Bulan: <strong>{slipDate}</strong></p>
                        </div>
                    </div>
                </section>

                <main className="grid grid-cols-2 gap-x-4">
                    {/* LEFT COLUMN */}
                    <div>
                        <SlipSection title="KEADAAN AWAL BULAN" bgColor="bg-blue-100">
                            <SlipRow label="Simpanan Pokok" value={keuangan.awal_simpanan_pokok} />
                            <SlipRow label="Simpanan Wajib" value={keuangan.awal_simpanan_wajib} />
                            <SlipRow label="Simpanan Sukarela" value={keuangan.sukarela} />
                            <SlipRow label="Simpanan Wisata" value={keuangan.awal_simpanan_wisata} />
                            <SlipRow label="Pinjaman Berjangka" value={keuangan.awal_pinjaman_berjangka} />
                            <SlipRow label="Pinjaman Khusus" value={keuangan.awal_pinjaman_khusus} />
                        </SlipSection>
                        <SlipSection title="KEADAAN AKHIR" bgColor="bg-blue-100">
                            <SlipRow label="Simpanan Pokok" value={keuangan.akhir_simpanan_pokok} />
                            <SlipRow label="Simpanan Wajib" value={keuangan.akhir_simpanan_wajib} />
                            <SlipRow label="Simpanan Sukarela" value={keuangan.akhir_simpanan_sukarela} />
                            <SlipRow label="Simpanan Wisata" value={keuangan.akhir_simpanan_wisata} />
                            <SlipRow label="Pinjaman Berjangka" value={keuangan.akhir_pinjaman_berjangka} />
                            <SlipRow label="Pinjaman Khusus" value={keuangan.akhir_pinjaman_khusus} />
                        </SlipSection>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div>
                         <SlipSection title="PENGAMBILAN SIMPANAN" bgColor="bg-rose-100">
                            <SlipRow label="Simpanan Pokok" value={keuangan.transaksi_pengambilan_simpanan_pokok} />
                            <SlipRow label="Simpanan Wajib" value={keuangan.transaksi_pengambilan_simpanan_wajib} />
                            <SlipRow label="Simpanan Sukarela" value={keuangan.transaksi_pengambilan_simpanan_sukarela} />
                            <SlipRow label="Simpanan Wisata" value={keuangan.transaksi_pengambilan_simpanan_wisata} />
                        </SlipSection>
                        <SlipSection title="PENAMBAHAN PINJAMAN" bgColor="bg-rose-100">
                             <SlipRow label="Pinjaman Berjangka" isEqual={true} value={keuangan.transaksi_penambahan_pinjaman_berjangka} />
                             <SlipRow label="Pinjaman Khusus" isEqual={true} value={keuangan.transaksi_penambahan_pinjaman_khusus} />
                        </SlipSection>
                         <SlipSection title="SETORAN BULAN INI" bgColor="bg-green-100">
                            <SlipRow label="Simpanan Pokok" value={keuangan.transaksi_simpanan_pokok} />
                            <SlipRow label="Simpanan Wajib" value={keuangan.transaksi_simpanan_wajib} />
                            <SlipRow label="Angs Pinj Berjangka" value={keuangan.transaksi_pinjaman_berjangka} />
                            <SlipRow label="Angs Pinj Khusus" value={keuangan.transaksi_pinjaman_khusus} />
                             <div className="flex justify-between items-baseline font-bold text-xs mt-2 pt-1 border-t border-black">
                                <span>JUMLAH SETORAN</span>
                                <div className="flex items-baseline">
                                    <span>Rp</span>
                                    <span className="w-24 text-right">{formatCurrency(keuangan.Jumlah_setoran)}</span>
                                </div>
                            </div>
                        </SlipSection>
                    </div>
                </main>
                
                <footer className="mt-8">
                    <div className="flex justify-between text-center text-xs">
                        <div>
                            <p>Mengetahui,</p>
                            <p className="font-bold">Ketua</p>
                            <div className="h-12"></div>
                            <p className="font-bold underline">N Dedi Z, M.Pd.</p>
                        </div>
                        <div>
                             <p>Bendahara,</p>
                             <div className="h-12"></div>
                             <p className="font-bold underline">R.B. Kustianto, S.Pd.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SlipRincian;
