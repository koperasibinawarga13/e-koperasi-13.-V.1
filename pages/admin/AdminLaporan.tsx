import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { CreditCardIcon, ChartBarIcon } from '../../components/icons/Icons';
import { getKeuangan } from '../../services/keuanganService';
import { Keuangan } from '../../types';

const AdminLaporan: React.FC = () => {
    const [keuanganList, setKeuanganList] = useState<Keuangan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                     <input
                        type="text"
                        placeholder="Cari (nama, no. anggota)..."
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/3 focus:ring-1 focus:ring-primary focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                                        <td className="px-4 py-4 sm:px-6 text-right">{formatCurrency(item.akhir_simpanan_pokok)}</td>
                                        <td className="px-4 py-4 sm:px-6 text-right">{formatCurrency(item.akhir_simpanan_wajib)}</td>
                                        <td className="px-4 py-4 sm:px-6 text-right font-semibold text-green-600">{formatCurrency(item.jumlah_total_simpanan)}</td>
                                        <td className="px-4 py-4 sm:px-6 text-right font-semibold text-yellow-600">{formatCurrency(item.jumlah_total_pinjaman)}</td>
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