import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import { getAnggotaByNo } from '../../services/anggotaService';
import { batchProcessTransaksiBulanan } from '../../services/keuanganService';
import { TransaksiBulanan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PrintIcon, PlusIcon, PencilIcon } from '../../components/icons/Icons';

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

// Moved FormField outside the main component to prevent re-creation on every render, fixing the cursor jump issue.
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

// Moved Section outside for better component structure and performance.
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
    const [noAnggota, setNoAnggota] = useState('');
    const [namaAnggota, setNamaAnggota] = useState<string | null>(null);
    const [isAnggotaLoading, setIsAnggotaLoading] = useState(false);
    
    const defaultPeriode = new Date().toISOString().slice(0, 7); // YYYY-MM
    const defaultTanggal = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [periode, setPeriode] = useState(defaultPeriode);
    const [tanggalTransaksi, setTanggalTransaksi] = useState(defaultTanggal);
    
    const [transaksiData, setTransaksiData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [lastSuccessfulTx, setLastSuccessfulTx] = useState<TransaksiBulanan | null>(null);
    const [isEditing, setIsEditing] = useState(false);


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
    
    // Auto-calculate total deposits
    const jumlahSetoran = useMemo(() => {
        return (
            (transaksiData.transaksi_simpanan_pokok || 0) +
            (transaksiData.transaksi_simpanan_wajib || 0) +
            (transaksiData.transaksi_simpanan_sukarela || 0) +
            (transaksiData.transaksi_simpanan_wisata || 0) +
            (transaksiData.transaksi_pinjaman_berjangka || 0) +
            (transaksiData.transaksi_pinjaman_khusus || 0) +
            (transaksiData.transaksi_simpanan_jasa || 0) +
            (transaksiData.transaksi_niaga || 0) +
            (transaksiData.transaksi_dana_perlaya || 0) +
            (transaksiData.transaksi_dana_katineng || 0)
        );
    }, [transaksiData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Remove non-digit characters to parse the number
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
        setTransaksiData(prev => ({
            ...prev,
            [name]: isNaN(numericValue) ? 0 : numericValue,
        }));
    };
    
    const handleReset = () => {
        setNoAnggota('');
        setNamaAnggota(null);
        setPeriode(defaultPeriode);
        setTanggalTransaksi(defaultTanggal);
        setTransaksiData(initialFormState);
        setMessage(null);
        setLastSuccessfulTx(null);
        setIsEditing(false);
    };
    
    const handleEdit = () => {
        if (!lastSuccessfulTx) return;

        setNoAnggota(lastSuccessfulTx.no_anggota);
        setNamaAnggota(lastSuccessfulTx.nama_angota || null);
        setPeriode(periode);
        setTanggalTransaksi(lastSuccessfulTx.tanggal_transaksi || defaultTanggal);
        
        const { no_anggota, nama_angota, admin_nama, tanggal_transaksi, Jumlah_setoran, ...formData } = lastSuccessfulTx;
        setTransaksiData(formData as any);
        
        setIsEditing(true);
        setLastSuccessfulTx(null);
        setMessage({type: 'success', text: 'Anda sekarang dalam mode edit. Silakan ubah data yang diperlukan.'});
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
            const result = await batchProcessTransaksiBulanan([dataToSubmit], periode);
            if (result.errorCount > 0) {
                throw new Error(result.errors[0]?.error || 'Terjadi kesalahan saat memproses transaksi.');
            }
            const successText = isEditing
                ? `Transaksi untuk ${namaAnggota} pada periode ${periode} berhasil diperbarui.`
                : `Transaksi untuk ${namaAnggota} pada periode ${periode} berhasil disimpan.`;

            setMessage({ type: 'success', text: successText });
            setLastSuccessfulTx(dataToSubmit);
            setIsEditing(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintAndNotify = () => {
        if (!lastSuccessfulTx) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Gagal membuka jendela cetak. Mohon izinkan pop-up untuk situs ini.');
            return;
        }

        const { no_anggota, nama_angota, admin_nama, tanggal_transaksi, ...txData } = lastSuccessfulTx;

        const detailRows = Object.entries(txData)
            .filter(([key, value]) => typeof value === 'number' && value > 0 && key !== 'Jumlah_setoran')
            .map(([key, value]) => {
                const label = key.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
                return `<tr><td>${label}</td><td style="text-align: right;">${new Intl.NumberFormat('id-ID').format(value as number)}</td></tr>`;
            })
            .join('');

        const receiptHTML = `
            <html>
                <head>
                    <title>Bukti Transaksi - ${no_anggota}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; margin: 20px; font-size: 12px; }
                        .container { width: 300px; border: 1px solid #ccc; padding: 15px; }
                        h2, h3 { text-align: center; margin: 0 0 10px 0; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                        td { padding: 2px 0; }
                        hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
                        .footer { font-size: 10px; text-align: center; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Koperasi Bina 13 Warga</h2>
                        <h3>BUKTI TRANSAKSI</h3>
                        <hr>
                        <table>
                            <tr><td>No Anggota</td><td>: ${no_anggota}</td></tr>
                            <tr><td>Nama</td><td>: ${nama_angota}</td></tr>
                            <tr><td>Periode</td><td>: ${new Date(`${periode}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</td></tr>
                            <tr><td>Tgl. Input</td><td>: ${new Date(tanggalTransaksi).toLocaleDateString('id-ID')}</td></tr>
                        </table>
                        <hr>
                        <table>
                            ${detailRows}
                        </table>
                        <hr>
                        <table>
                            <tr><td><strong>TOTAL SETORAN</strong></td><td style="text-align: right;"><strong>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(lastSuccessfulTx.Jumlah_setoran)}</strong></td></tr>
                        </table>
                        <hr>
                        <div class="footer">
                            Diinput oleh: ${admin_nama}<br>
                            Terima kasih atas setoran Anda.
                        </div>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);

        alert('Notifikasi simulasi berhasil dikirim ke anggota.');
    };
    
    const DetailItem: React.FC<{label: string; value: string | number}> = ({ label, value }) => (
        <div className="flex justify-between py-1">
            <span className="text-gray-600">{label}:</span>
            <span className="font-semibold text-dark">{typeof value === 'number' ? new Intl.NumberFormat('id-ID').format(value) : value}</span>
        </div>
    );

    return (
        <div>
            <Header title="Input Transaksi Bulanan" />
            <div className="bg-white p-6 rounded-xl shadow-md">
                {lastSuccessfulTx ? (
                    <div className="py-8">
                        <div className="mb-6 p-4 rounded-md text-sm bg-green-100 text-green-800 text-center">
                            {message?.text}
                        </div>
                        <div className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-lg border">
                            <h3 className="text-lg font-bold text-dark mb-4 text-center">Rincian Transaksi Tersimpan</h3>
                            <DetailItem label="No. Anggota" value={lastSuccessfulTx.no_anggota} />
                            <DetailItem label="Nama" value={lastSuccessfulTx.nama_angota || ''} />
                            <DetailItem label="Periode" value={new Date(`${periode}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} />
                            <DetailItem label="Tanggal Input" value={new Date(tanggalTransaksi).toLocaleDateString('id-ID')} />
                            <hr className="my-3"/>
                            {Object.entries(lastSuccessfulTx)
                                .filter(([key, value]) => typeof value === 'number' && value > 0 && !['no', 'Jumlah_setoran'].includes(key))
                                .map(([key, value]) => (
                                    <DetailItem 
                                        key={key} 
                                        label={key.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}
                                        value={value as number}
                                    />
                            ))}
                            <div className="mt-4 p-3 rounded-md bg-blue-100 flex justify-between items-center">
                                <span className="font-bold text-blue-800">TOTAL SETORAN</span>
                                <span className="font-bold text-blue-800 text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(lastSuccessfulTx.Jumlah_setoran)}</span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4 mt-8">
                            <button
                                onClick={handleEdit}
                                className="bg-amber-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-amber-600 flex items-center gap-2"
                            >
                                <PencilIcon className="w-5 h-5"/>
                                Edit Transaksi
                            </button>
                            <button
                                onClick={handlePrintAndNotify}
                                className="bg-secondary text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-secondary-dark flex items-center gap-2"
                            >
                                <PrintIcon className="w-5 h-5"/>
                                Cetak & Kirim Notifikasi
                            </button>
                             <button
                                type="button"
                                onClick={handleReset}
                                className="bg-primary text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-dark flex items-center gap-2"
                            >
                                <PlusIcon className="w-5 h-5"/>
                                Input Transaksi Baru
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {isEditing && message && (
                             <div className={`mb-4 p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="noAnggota" className="block text-sm font-medium text-gray-700">Nomor Anggota</label>
                                <input
                                    type="text"
                                    id="noAnggota"
                                    value={noAnggota}
                                    onChange={(e) => setNoAnggota(e.target.value)}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                    placeholder="e.g. AK-101"
                                />
                                <div className="mt-1 min-h-[20px] text-sm font-semibold">
                                    {isAnggotaLoading && <span className="text-gray-500">Mencari...</span>}
                                    {namaAnggota && (
                                        <span className={namaAnggota.includes('ditemukan') || namaAnggota.includes('Gagal') ? 'text-red-600' : 'text-green-600'}>
                                            {namaAnggota}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="periode" className="block text-sm font-medium text-gray-700">Periode Laporan</label>
                                <input
                                    type="month"
                                    id="periode"
                                    value={periode}
                                    onChange={(e) => setPeriode(e.target.value)}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                />
                            </div>
                            <div>
                                <label htmlFor="tanggalTransaksi" className="block text-sm font-medium text-gray-700">Tanggal Input Transaksi</label>
                                <input
                                    type="date"
                                    id="tanggalTransaksi"
                                    value={tanggalTransaksi}
                                    onChange={(e) => setTanggalTransaksi(e.target.value)}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                />
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
                            <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">Total Setoran</h3>
                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-blue-800">Total Setoran Bulan Ini</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(jumlahSetoran)}
                                </p>
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
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="bg-gray-200 text-gray-800 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-gray-300"
                                >
                                    Reset Form
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !namaAnggota || namaAnggota === 'Anggota tidak ditemukan'}
                                    className="bg-primary text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-primary-dark disabled:bg-gray-400"
                                >
                                    {isSubmitting ? 'Memproses...' : (isEditing ? 'Update Transaksi' : 'Simpan Transaksi')}
                                </button>
                            </div>
                        </div>

                        {message && !lastSuccessfulTx && !isEditing && (
                            <div className={`mt-4 p-4 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : ''}`}>
                                {message.text}
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminTransaksi;