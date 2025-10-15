import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getKeuanganByNoAnggota } from '../../services/keuanganService';
import { getAnggotaById } from '../../services/anggotaService';
import { Keuangan, Anggota } from '../../types';
import { BuildingOfficeIcon, PrintIcon, ChevronLeftIcon } from '../../components/icons/Icons';

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

    const SlipRow: React.FC<{ label: string; value: number | undefined }> = ({ label, value }) => (
        <div className="flex justify-between items-baseline text-sm mb-1">
            <span>- {label}</span>
            <div className="flex items-baseline">
                <span>Rp</span>
                <span className="w-24 text-right">{formatCurrency(value)}</span>
            </div>
        </div>
    );
    
    const SlipSection: React.FC<{title: string, children: React.ReactNode, bgColor?: string}> = ({title, children, bgColor = 'bg-gray-200'}) => (
        <section className="mb-4">
            <h3 className={`font-bold text-sm p-1 ${bgColor} text-black`}>{title}</h3>
            <div className="pt-2">
                {children}
            </div>
        </section>
    );

    return (
        <div className="bg-gray-100 min-h-screen font-sans print:bg-white">
            <div className="max-w-4xl mx-auto p-4 flex justify-between items-center print:hidden">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50">
                    <ChevronLeftIcon className="w-5 h-5" />
                    Kembali
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-800">
                    <PrintIcon className="w-5 h-5" />
                    Cetak Ulang
                </button>
            </div>

            <div id="slip-content" className="max-w-4xl mx-auto bg-white p-6 border text-black print:border-none print:shadow-none">
                <header className="flex justify-between items-start pb-4 border-b-2 border-black">
                    <div className="flex items-center gap-4">
                        <BuildingOfficeIcon className="w-16 h-16 text-primary flex-shrink-0" />
                        <div>
                            <h1 className="font-bold text-lg">KOPERASI BINA WARGA SMP NEGERI 13 TASIKMALAYA</h1>
                            <p className="text-sm">Jln Letjend H. Ibrahim Adjie Km2. Indihiang Tasikmalaya</p>
                            <h1 className="font-bold text-lg">Tasikmalaya</h1>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                        <h2 className="font-bold text-lg">SLIP RINCIAN</h2>
                        <p>{slipDate}</p>
                    </div>
                </header>

                <section className="my-4 text-sm">
                    <table className="w-1/2">
                        <tbody>
                            <tr>
                                <td className="w-28 font-semibold">No Anggota</td>
                                <td>: {anggota.no_anggota}</td>
                            </tr>
                            <tr>
                                <td className="w-28 font-semibold">Nama Anggota</td>
                                <td>: {anggota.nama}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <main className="grid grid-cols-2 gap-x-12">
                    {/* LEFT COLUMN */}
                    <div>
                        <SlipSection title="KEADAAN AWAL BULAN" bgColor="bg-blue-200">
                            <SlipRow label="Simpanan Pokok" value={keuangan.awal_simpanan_pokok} />
                            <SlipRow label="Simpanan Wajib" value={keuangan.awal_simpanan_wajib} />
                            <SlipRow label="Simpanan Sukarela" value={keuangan.sukarela} />
                            <SlipRow label="Simpanan Wisata" value={keuangan.awal_simpanan_wisata} />
                            <SlipRow label="Pinjaman Berjangka" value={keuangan.awal_pinjaman_berjangka} />
                            <SlipRow label="Pinjaman Khusus" value={keuangan.awal_pinjaman_khusus} />
                        </SlipSection>
                        <SlipSection title="KEADAAN AKHIR BULAN" bgColor="bg-blue-200">
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
                         <SlipSection title="PENGAMBILAN SIMPANAN" bgColor="bg-red-200">
                            <SlipRow label="Simpanan Pokok" value={keuangan.transaksi_pengambilan_simpanan_pokok} />
                            <SlipRow label="Simpanan Wajib" value={keuangan.transaksi_pengambilan_simpanan_wajib} />
                            <SlipRow label="Simpanan Sukarela" value={keuangan.transaksi_pengambilan_simpanan_sukarela} />
                            <SlipRow label="Simpanan Wisata" value={keuangan.transaksi_pengambilan_simpanan_wisata} />
                        </SlipSection>
                        <SlipSection title="PENAMBAHAN PINJAMAN" bgColor="bg-red-200">
                             <SlipRow label="Pinjaman Berjangka" value={keuangan.transaksi_penambahan_pinjaman_berjangka} />
                             <SlipRow label="Pinjaman Khusus" value={keuangan.transaksi_penambahan_pinjaman_khusus} />
                             <SlipRow label="Pinjaman Niaga" value={keuangan.transaksi_penambahan_pinjaman_niaga} />
                        </SlipSection>
                         <SlipSection title="SETORAN BULAN INI" bgColor="bg-red-200">
                            <SlipRow label="Simpanan Pokok" value={keuangan.transaksi_simpanan_pokok} />
                            <SlipRow label="Simpanan Wajib" value={keuangan.transaksi_simpanan_wajib} />
                            <SlipRow label="Simpanan Sukarela" value={keuangan.transaksi_simpanan_sukarela} />
                            <SlipRow label="Simpanan Wisata" value={keuangan.transaksi_simpanan_wisata} />
                            <SlipRow label="Pinjaman Berjangka" value={keuangan.transaksi_pinjaman_berjangka} />
                            <SlipRow label="Pinjaman Khusus" value={keuangan.transaksi_pinjaman_khusus} />
                            <SlipRow label="Jasa" value={keuangan.transaksi_simpanan_jasa} />
                            <SlipRow label="Niaga" value={keuangan.transaksi_niaga} />
                            <SlipRow label="Dana Perlaya" value={keuangan.transaksi_dana_perlaya} />
                            <SlipRow label="Dana Katineng" value={keuangan.transaksi_dana_katineng} />
                            <div className="flex justify-between items-baseline font-bold text-sm mt-2 pt-2 border-t border-black">
                                <span>JUMLAH SETORAN</span>
                                <div className="flex items-baseline">
                                    <span>Rp</span>
                                    <span className="w-24 text-right">{formatCurrency(keuangan.Jumlah_setoran)}</span>
                                </div>
                            </div>
                        </SlipSection>
                    </div>
                </main>
                
                <footer className="mt-4 border-t-4 border-black pt-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold">Jumlah Potongan</span>
                        <div className="bg-gray-200 p-1 font-bold">Nol Rupiah</div>
                    </div>
                </footer>

                <section className="mt-12 flex justify-between text-center text-sm">
                    <div>
                        <p>Mengetahui,</p>
                        <p className="font-bold">Ketua</p>
                        <div className="h-20 w-20 my-2 mx-auto border flex items-center justify-center text-gray-400 text-xs">QR Code</div>
                        <p className="font-bold underline">N Dedi Z, M.Pd.</p>
                    </div>
                    <div>
                         <p>Bendahara,</p>
                         <div className="h-20 w-20 my-2 mx-auto border flex items-center justify-center text-gray-400 text-xs">QR Code</div>
                         <p className="font-bold underline">R.B. Kustianto, S.Pd.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SlipRincian;
