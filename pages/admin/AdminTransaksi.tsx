import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getAnggotaByNo } from '../../services/anggotaService';
import { batchProcessTransaksiBulanan, correctPastTransaction } from '../../services/keuanganService';
import { createLog, getLogById } from '../../services/transaksiLogService';
import { TransaksiBulanan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PrintIcon, PlusIcon, PencilIcon, ClockIcon } from '../../components/icons/Icons';

const initialFormState: Omit<TransaksiBulanan, 'no_anggota' | 'nama_angota' | 'admin_nama' | 'tanggal_transaksi' | 'Jumlah_setoran'> = {
    transaksi_simpanan_pokok: 0,
    transaksi_simpanan_wajib: 0,
    transaksi_simpanan_sukarela: 0,
    transaksi_simpanan_wisata: 0,
    transaksi_pinjaman_berjangka: 0,
    transaksi_pinjaman_khusus: 0,
    transaksi_simpanan_jasa: 0,
    transaksi_niaga: 0,
    transaksi_dana_perlaya: 0,
    transaksi_dana_katineng: 0,
    transaksi_pengambilan_simpanan_pokok: 0,
    transaksi_pengambilan_simpanan_wajib: 0,
    transaksi_pengambilan_simpanan_sukarela: 0,
    transaksi_pengambilan_simpanan_wisata: 0,
    transaksi_penambahan_pinjaman_berjangka: 0,
    transaksi_penambahan_pinjaman_khusus: 0,
    transaksi_penambahan_pinjaman_niaga: 0,
};

const FormField: React.FC<{
    label: string;
    name: keyof typeof initialFormState;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = React.memo(({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type="text"
            inputMode="numeric"
            id={name}
            name={name}
            value={value === 0 ? '' : new Intl.NumberFormat('id-ID').format(value)}
            onChange={onChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-right"
            placeholder="0"
            autoComplete="off"
        />
    </div>
));

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children}
        </div>
    </div>
);

const AdminTransaksi: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editLogId = searchParams.get('editLogId');

    const [noAnggota, setNoAnggota] = useState('');
    const [namaAnggota, setNamaAnggota] = useState<string | null>(null);
    const [isAnggotaLoading, setIsAnggotaLoading] = useState(false);
    
    const defaultPeriode = new Date().toISOString().slice(0, 7);
    const defaultTanggal = new Date().toISOString().slice(0, 10);

    const [periode, setPeriode] = useState(defaultPeriode);
    const [tanggalTransaksi, setTanggalTransaksi] = useState(defaultTanggal);
    
    const [transaksiData, setTransaksiData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [lastSuccessfulTx, setLastSuccessfulTx] = useState<TransaksiBulanan | null>(null);
    
    useEffect(() => {
        if (editLogId) {
            const fetchLogData = async () => {
                const logData = await getLogById(editLogId);
                if (logData) {
                    setNoAnggota(logData.no_anggota);
                    setNamaAnggota(logData.nama_angota || null);
                    setPeriode(logData.periode);
                    setTanggalTransaksi(logData.tanggal_transaksi || defaultTanggal);
                    const { no_anggota, nama_angota, admin_nama, tanggal_transaksi, Jumlah_setoran, log_time, type, id, periode, ...formData } = logData;
                    setTransaksiData(formData as any);
                    setMessage({type: 'success', text: `Mode Edit Riwayat: Mengubah transaksi untuk ${logData.nama_angota} pada periode ${logData.periode}.`});
                } else {
                     setMessage({type: 'error', text: 'Gagal memuat data transaksi untuk diedit.'});
                }
            };
            fetchLogData();
        }
    }, [editLogId]);


    // Debounced search for member name
    useEffect(() => {
        if (!noAnggota) {
            setNamaAnggota(null);
            return;
        }
        setIsAnggotaLoading(true);
        const handler = setTimeout(async () => {
            try {
                const anggota = await getAnggotaByNo(noAnggota.toUpperCase());
                setNamaAnggota(anggota ? anggota.nama : 'Anggota tidak ditemukan');
            } catch (err) {
                setNamaAnggota('Gagal memuat nama');
            } finally {
                setIsAnggotaLoading(false);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [noAnggota]);
    
    const jumlahSetoran = useMemo(() => {
        return Object.entries(transaksiData)
            .filter(([key]) => key.startsWith('transaksi_') && !key.includes('pengambilan') && !key.includes('penambahan'))
            // FIX: Operator '+' cannot be applied to types 'number' and 'unknown'. Cast `value` to number to resolve.
            .reduce((sum, [, value]) => sum + (value as number), 0);
    }, [transaksiData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
        setTransaksiData(prev => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
    };
    
    const handleReset = () => {
        navigate('/admin/transaksi'); // Clear URL params
        setNoAnggota('');
        setNamaAnggota(null);
        setPeriode(defaultPeriode);
        setTanggalTransaksi(defaultTanggal);
        setTransaksiData(initialFormState);
        setMessage(null);
        setLastSuccessfulTx(null);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noAnggota || !namaAnggota || namaAnggota === 'Anggota tidak ditemukan' || namaAnggota === 'Gagal memuat nama') {
            setMessage({ type: 'error', text: 'Nomor Anggota tidak valid.' });
            return;
        }
        
        setIsSubmitting(true);
        setMessage(null);
        
        const dataToSubmit: TransaksiBulanan = {
            ...transaksiData,
            Jumlah_setoran: jumlahSetoran,
            no_anggota: noAnggota.toUpperCase(),
            nama_angota: namaAnggota,
            admin_nama: user?.name || 'Admin',
            tanggal_transaksi: tanggalTransaksi,
        };
        
        try {
            if (editLogId) {
                // Update existing log and recalculate
                await correctPastTransaction(editLogId, dataToSubmit, user?.name || 'Admin');
                setMessage({ type: 'success', text: `Riwayat transaksi berhasil diperbarui dan semua data terkait telah direkalkulasi.` });
                setTimeout(() => navigate('/admin/riwayat-transaksi'), 2000); // Redirect after success
            } else {
                // Process new transaction and create log
                const result = await batchProcessTransaksiBulanan([dataToSubmit], periode);
                if (result.errorCount > 0) throw new Error(result.errors[0]?.error || 'Terjadi kesalahan.');
                
                await createLog({ ...dataToSubmit, periode, type: 'INPUT BARU' });
                setMessage({ type: 'success', text: `Transaksi baru untuk ${namaAnggota} berhasil disimpan.` });
                setLastSuccessfulTx(dataToSubmit);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const DetailItem: React.FC<{label: string; value: string | number}> = ({ label, value }) => (
        <div className="flex justify-between py-1">
            <span className="text-gray-600">{label}:</span>
            <span className="font-semibold text-dark">{typeof value === 'number' ? new Intl.NumberFormat('id-ID').format(value) : value}</span>
        </div>
    );

    const formTitle = editLogId ? 'Edit Riwayat Transaksi' : 'Input Transaksi Bulanan';
    const submitButtonText = isSubmitting ? 'Memproses...' : (editLogId ? 'Update & Rekalkulasi Riwayat' : 'Simpan Transaksi');

    return (
        <div>
            <Header title={formTitle} />
            <div className="bg-white p-6 rounded-xl shadow-md">
                {lastSuccessfulTx ? (
                    <div className="py-8 text-center">
                        <div className="mb-6 p-4 rounded-md text-sm bg-green-100 text-green-800">
                           {message?.text}
                        </div>
                        <h3 className="text-lg font-bold text-dark mb-4">Rincian Transaksi Tersimpan</h3>
                         <div className="max-w-md mx-auto bg-gray-50 p-4 rounded-lg border text-left">
                            <DetailItem label="No. Anggota" value={lastSuccessfulTx.no_anggota} />
                            <DetailItem label="Nama" value={lastSuccessfulTx.nama_angota || ''} />
                            <div className="mt-4 p-3 rounded-md bg-blue-100 flex justify-between items-center">
                                <span className="font-bold text-blue-800">TOTAL SETORAN</span>
                                <span className="font-bold text-blue-800 text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(lastSuccessfulTx.Jumlah_setoran)}</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-8">
                             <button onClick={handleReset} className="bg-primary text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-dark flex items-center gap-2">
                                <PlusIcon className="w-5 h-5"/> Input Transaksi Baru
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {message && (
                             <div className={`mb-4 p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="noAnggota" className="block text-sm font-medium text-gray-700">Nomor Anggota</label>
                                <input
                                    type="text" id="noAnggota" value={noAnggota} onChange={(e) => setNoAnggota(e.target.value)} required disabled={!!editLogId}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 disabled:bg-gray-100"
                                />
                                <div className="mt-1 min-h-[20px] text-sm font-semibold">
                                    {isAnggotaLoading && <span className="text-gray-500">Mencari...</span>}
                                    {namaAnggota && (<span className={namaAnggota.includes('ditemukan') || namaAnggota.includes('Gagal') ? 'text-red-600' : 'text-green-600'}>{namaAnggota}</span>)}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="periode" className="block text-sm font-medium text-gray-700">Periode Laporan</label>
                                <input
                                    type="month" id="periode" value={periode} onChange={(e) => setPeriode(e.target.value)} required disabled={!!editLogId}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 disabled:bg-gray-100"
                                />
                            </div>
                            <div>
                                <label htmlFor="tanggalTransaksi" className="block text-sm font-medium text-gray-700">Tanggal Input Transaksi</label>
                                <input type="date" id="tanggalTransaksi" value={tanggalTransaksi} onChange={(e) => setTanggalTransaksi(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                            </div>
                        </div>
                        
                        <Section title="Setoran Simpanan & Angsuran">
                            <FormField label="Simpanan Pokok" name="transaksi_simpanan_pokok" value={transaksiData.transaksi_simpanan_pokok} onChange={handleInputChange} />
                            <FormField label="Simpanan Wajib" name="transaksi_simpanan_wajib" value={transaksiData.transaksi_simpanan_wajib} onChange={handleInputChange} />
                            <FormField label="Simpanan Sukarela" name="transaksi_simpanan_sukarela" value={transaksiData.transaksi_simpanan_sukarela} onChange={handleInputChange} />
                            <FormField label="Simpanan Wisata" name="transaksi_simpanan_wisata" value={transaksiData.transaksi_simpanan_wisata} onChange={handleInputChange} />
                            <FormField label="Angsuran Pinjaman Berjangka" name="transaksi_pinjaman_berjangka" value={transaksiData.transaksi_pinjaman_berjangka} onChange={handleInputChange} />
                            <FormField label="Angsuran Pinjaman Khusus" name="transaksi_pinjaman_khusus" value={transaksiData.transaksi_pinjaman_khusus} onChange={handleInputChange} />
                        </Section>

                        <Section title="Setoran Lain-lain">
                            <FormField label="Jasa" name="transaksi_simpanan_jasa" value={transaksiData.transaksi_simpanan_jasa} onChange={handleInputChange} />
                            <FormField label="Niaga" name="transaksi_niaga" value={transaksiData.transaksi_niaga} onChange={handleInputChange} />
                            <FormField label="Dana Perlaya" name="transaksi_dana_perlaya" value={transaksiData.transaksi_dana_perlaya} onChange={handleInputChange} />
                            <FormField label="Dana Katineng" name="transaksi_dana_katineng" value={transaksiData.transaksi_dana_katineng} onChange={handleInputChange} />
                        </Section>
                        
                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Total Setoran</h3>
                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-blue-800">Total Setoran Bulan Ini</p>
                                <p className="text-2xl font-bold text-blue-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(jumlahSetoran)}</p>
                            </div>
                        </div>
                        
                        <Section title="Pengambilan Simpanan">
                            <FormField label="Pengambilan Simp. Pokok" name="transaksi_pengambilan_simpanan_pokok" value={transaksiData.transaksi_pengambilan_simpanan_pokok} onChange={handleInputChange} />
                            <FormField label="Pengambilan Simp. Wajib" name="transaksi_pengambilan_simpanan_wajib" value={transaksiData.transaksi_pengambilan_simpanan_wajib} onChange={handleInputChange} />
                            <FormField label="Pengambilan Simp. Sukarela" name="transaksi_pengambilan_simpanan_sukarela" value={transaksiData.transaksi_pengambilan_simpanan_sukarela} onChange={handleInputChange} />
                            <FormField label="Pengambilan Simp. Wisata" name="transaksi_pengambilan_simpanan_wisata" value={transaksiData.transaksi_pengambilan_simpanan_wisata} onChange={handleInputChange} />
                        </Section>
                        
                        <Section title="Penambahan Pinjaman">
                            <FormField label="Penambahan Pinj. Berjangka" name="transaksi_penambahan_pinjaman_berjangka" value={transaksiData.transaksi_penambahan_pinjaman_berjangka} onChange={handleInputChange} />
                            <FormField label="Penambahan Pinj. Khusus" name="transaksi_penambahan_pinjaman_khusus" value={transaksiData.transaksi_penambahan_pinjaman_khusus} onChange={handleInputChange} />
                            <FormField label="Penambahan Pinj. Niaga" name="transaksi_penambahan_pinjaman_niaga" value={transaksiData.transaksi_penambahan_pinjaman_niaga} onChange={handleInputChange} />
                        </Section>
                        
                        <div className="mt-8 border-t pt-5">
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={handleReset} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-300">
                                   {editLogId ? 'Batalkan Edit' : 'Reset Form'}
                                </button>
                                <button type="submit" disabled={isSubmitting || !namaAnggota || namaAnggota === 'Anggota tidak ditemukan'} className="bg-primary text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-dark disabled:bg-gray-400">
                                    {submitButtonText}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminTransaksi;