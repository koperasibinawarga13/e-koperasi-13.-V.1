// FIX: Implemented full content for AdminUpload.tsx to create the file upload page.
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
// FIX: Import the 'xlsx' library to handle Excel file parsing.
import * as XLSX from 'xlsx';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import Modal from '../../components/Modal';
import { UploadIcon, TrashIcon, DownloadIcon, ChevronDownIcon } from '../../components/icons/Icons';
import { batchAddAnggota } from '../../services/anggotaService';
import { batchUpsertKeuangan, batchProcessTransaksiBulanan, getUploadedMonths, deleteMonthlyReport, rebuildUploadHistory, getKeuangan } from '../../services/keuanganService';
import { Anggota, Keuangan, TransaksiBulanan } from '../../types';
import { useAuth } from '../../context/AuthContext';

type UploadStatus = 'idle' | 'processing' | 'success' | 'error';

interface UploadResult {
    successCount: number;
    errorCount: number;
    errors: { no_anggota: string; error: string }[];
}


// Helper to safely parse numbers from Excel
const parseNumber = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

// Reusable Upload Section Component
const UploadSection: React.FC<{
    title: string;
    instructions: string;
    onFileUpload: (file: File) => Promise<UploadResult | void>;
    disabled: boolean;
    hideTitle?: boolean;
    templateType?: 'anggota';
    onDownloadTemplate?: (type: 'anggota') => void;
}> = ({ title, instructions, onFileUpload, disabled, hideTitle = false, templateType, onDownloadTemplate }) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [isInstructionsVisible, setIsInstructionsVisible] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setStatus('idle');
            setProgress(0);
            setResult(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        maxFiles: 1,
    });

    const handleUpload = async () => {
        if (!file) return;
        setStatus('processing');
        setProgress(50);
        setResult(null);
        
        const uploadResult = await onFileUpload(file);

        setProgress(100);
        if (uploadResult) {
            setResult(uploadResult);
            setStatus(uploadResult.errorCount > 0 ? 'error' : 'success');
        } else {
            setStatus('success');
        }
    };
    
    const removeFile = () => {
        setFile(null);
        setStatus('idle');
        setProgress(0);
        setResult(null);
    }

    return (
        <div className={`bg-white p-6 ${hideTitle ? 'pt-0 rounded-b-xl' : 'rounded-xl'} shadow-md mb-8`}>
            {!hideTitle && (
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-dark">{title}</h2>
                    {templateType && onDownloadTemplate && (
                        <button 
                            onClick={() => onDownloadTemplate(templateType)}
                            className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-200 transition-colors"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            <span>Download Template</span>
                        </button>
                    )}
                </div>
            )}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <button 
                    onClick={() => setIsInstructionsVisible(!isInstructionsVisible)}
                    className="w-full flex justify-between items-center text-left"
                    aria-expanded={isInstructionsVisible}
                >
                    <h3 className="font-bold text-blue-800">Struktur File Excel (.xlsx)</h3>
                    <ChevronDownIcon className={`w-5 h-5 text-blue-800 transition-transform duration-300 ${isInstructionsVisible ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isInstructionsVisible ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                    <p className="text-sm text-blue-700 mt-2">Pastikan file Anda memiliki kolom header berikut (urutan dan nama harus sesuai):</p>
                    <code className="block bg-blue-100 p-2 rounded-md text-xs mt-2 whitespace-pre-wrap">{instructions}</code>
                </div>
            </div>
            
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'}`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                    <UploadIcon className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">
                        Seret & jatuhkan file di sini, atau <span className="text-primary font-semibold">klik untuk memilih</span>
                    </p>
                </div>
            </div>

            {file && (
                <div className="mt-6">
                    <div className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button onClick={removeFile} disabled={disabled} className="text-red-500 hover:text-red-700 text-sm font-semibold disabled:text-gray-400">Hapus</button>
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={disabled || status === 'processing'}
                        className="w-full mt-4 bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400"
                    >
                        {status === 'processing' ? 'Memproses...' : 'Mulai Unggah'}
                    </button>
                </div>
            )}
            
            {status !== 'idle' && (
                 <div className="mt-6">
                    <ProgressBar progress={progress} />
                    {status === 'success' && <p className="text-green-600 mt-2 text-center font-semibold">Proses unggah selesai! {result ? `${result.successCount} data berhasil diproses.` : ''}</p>}
                    {status === 'error' && result && (
                        <div className="text-red-600 mt-2 text-center font-semibold">
                            <p>Proses selesai dengan {result.errorCount} kesalahan.</p>
                             {result.successCount > 0 && <p className="text-green-600">{result.successCount} data berhasil diproses.</p>}
                             <details className="text-xs text-left mt-2 bg-red-50 p-2 rounded">
                                <summary>Lihat Detail Kesalahan</summary>
                                <ul className="list-disc pl-5 mt-1">
                                    {result.errors.slice(0, 5).map((e, i) => <li key={i}>Anggota {e.no_anggota}: {e.error}</li>)}
                                    {result.errors.length > 5 && <li>...dan lainnya.</li>}
                                </ul>
                             </details>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const AdminUpload: React.FC = () => {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadHistory, setUploadHistory] = useState<string[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isRebuilding, setIsRebuilding] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // State for delete confirmation modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [monthToDelete, setMonthToDelete] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsHistoryLoading(true);
            const months = await getUploadedMonths();
            setUploadHistory(months);
            setIsHistoryLoading(false);
        };
        fetchHistory();
    }, []);

    const readFile = (file: File): Promise<{ json: any[], sheetName: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                     if (!sheetName) {
                        return reject(new Error("File Excel tidak memiliki sheet."));
                    }
                    const worksheet = workbook.Sheets[sheetName];
                    const json: any[] = XLSX.utils.sheet_to_json(worksheet);
                    resolve({ json, sheetName });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    }

    const handleAnggotaUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const { json } = await readFile(file);
            const anggotaList = json.map(row => ({
                no_anggota: String(row.kode_anggota || '').trim(),
                nama: String(row.nama_anggota || '').trim(),
                no_telepon: String(row.no_hp || ''),
            })).filter(a => a.no_anggota && a.nama);

            if (anggotaList.length === 0) throw new Error("File tidak berisi data anggota yang valid.");
            
            await batchAddAnggota(anggotaList);
        } catch (err: any) {
            alert(`Gagal memproses file: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleKeuanganAwalUpload = async (file: File) => {
        setIsUploading(true);
         try {
            const { json } = await readFile(file);
            const keuanganList: Keuangan[] = json.map(row => ({
                no: parseNumber(row.no),
                no_anggota: String(row.no_anggota || '').trim(),
                nama_angota: String(row.nama_angota || '').trim(),
                awal_simpanan_pokok: parseNumber(row.awal_simpanan_pokok),
                awal_simpanan_wajib: parseNumber(row.awal_simpanan_wajib),
                sukarela: parseNumber(row.sukarela),
                awal_simpanan_wisata: parseNumber(row.awal_simpanan_wisata),
                awal_pinjaman_berjangka: parseNumber(row.awal_pinjaman_berjangka),
                awal_pinjaman_khusus: parseNumber(row.awal_pinjaman_khusus),
                transaksi_simpanan_pokok: parseNumber(row.transaksi_simpanan_pokok),
                transaksi_simpanan_wajib: parseNumber(row.transaksi_simpanan_wajib),
                transaksi_simpanan_sukarela: parseNumber(row.transaksi_simpanan_sukarela),
                transaksi_simpanan_wisata: parseNumber(row.transaksi_simpanan_wisata),
                transaksi_pinjaman_berjangka: parseNumber(row.transaksi_pinjaman_berjangka),
                transaksi_pinjaman_khusus: parseNumber(row.transaksi_pinjaman_khusus),
                transaksi_simpanan_jasa: parseNumber(row.transaksi_simpanan_jasa),
                transaksi_niaga: parseNumber(row.transaksi_niaga),
                transaksi_dana_perlaya: parseNumber(row.transaksi_dana_perlaya),
                transaksi_dana_katineng: parseNumber(row.transaksi_dana_katineng),
                Jumlah_setoran: parseNumber(row.Jumlah_setoran),
                transaksi_pengambilan_simpanan_pokok: parseNumber(row.transaksi_pengambilan_simpanan_pokok),
                transaksi_pengambilan_simpanan_wajib: parseNumber(row.transaksi_pengambilan_simpanan_wajib),
                transaksi_pengambilan_simpanan_sukarela: parseNumber(row.transaksi_pengambilan_simpanan_sukarela),
                transaksi_pengambilan_simpanan_wisata: parseNumber(row.transaksi_pengambilan_simpanan_wisata),
                transaksi_penambahan_pinjaman_berjangka: parseNumber(row.transaksi_penambahan_pinjaman_berjangka),
                transaksi_penambahan_pinjaman_khusus: parseNumber(row.transaksi_penambahan_pinjaman_khusus),
                transaksi_penambahan_pinjaman_niaga: parseNumber(row.transaksi_penambahan_pinjaman_niaga),
                akhir_simpanan_pokok: parseNumber(row.akhir_simpanan_pokok),
                akhir_simpanan_wajib: parseNumber(row.akhir_simpanan_wajib),
                akhir_simpanan_sukarela: parseNumber(row.akhir_simpanan_sukarela),
                akhir_simpanan_wisata: parseNumber(row.akhir_simpanan_wisata),
                akhir_pinjaman_berjangka: parseNumber(row.akhir_pinjaman_berjangka),
                akhir_pinjaman_khusus: parseNumber(row.akhir_pinjaman_khusus),
                jumlah_total_simpanan: parseNumber(row.jumlah_total_simpanan),
                jumlah_total_pinjaman: parseNumber(row.jumlah_total_pinjaman),
            })).filter(k => k.no_anggota);
            
             if (keuanganList.length === 0) throw new Error("File tidak berisi data keuangan yang valid.");
            
            await batchUpsertKeuangan(keuanganList);

        } catch (err: any) {
            alert(`Gagal memproses file: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleTransaksiBulananUpload = async (file: File): Promise<UploadResult> => {
        setIsUploading(true);
        try {
            const { json, sheetName } = await readFile(file);
            const match = sheetName.match(/^(\d{4})\s(\d{2})$/);
            if (!match) {
                throw new Error('Nama sheet Excel harus berformat "YYYY MM" (contoh: "2024 07").');
            }
            const uploadMonth = `${match[1]}-${match[2]}`;

            const transaksiList: TransaksiBulanan[] = json.map(row => ({
                 no_anggota: String(row.no_anggota || '').trim(),
                 nama_angota: String(row.nama_angota || '').trim(),
                 transaksi_simpanan_pokok: parseNumber(row.transaksi_simpanan_pokok),
                 transaksi_simpanan_wajib: parseNumber(row.transaksi_simpanan_wajib),
                 transaksi_simpanan_sukarela: parseNumber(row.transaksi_simpanan_sukarela),
                 transaksi_simpanan_wisata: parseNumber(row.transaksi_simpanan_wisata),
                 transaksi_pinjaman_berjangka: parseNumber(row.transaksi_pinjaman_berjangka),
                 transaksi_pinjaman_khusus: parseNumber(row.transaksi_pinjaman_khusus),
                 transaksi_simpanan_jasa: parseNumber(row.transaksi_simpanan_jasa),
                 transaksi_niaga: parseNumber(row.transaksi_niaga),
                 transaksi_dana_perlaya: parseNumber(row.transaksi_dana_perlaya),
                 transaksi_dana_katineng: parseNumber(row.transaksi_dana_katineng),
                 Jumlah_setoran: parseNumber(row.Jumlah_setoran),
                 transaksi_pengambilan_simpanan_pokok: parseNumber(row.transaksi_pengambilan_simpanan_pokok),
                 transaksi_pengambilan_simpanan_wajib: parseNumber(row.transaksi_pengambilan_simpanan_wajib),
                 transaksi_pengambilan_simpanan_sukarela: parseNumber(row.transaksi_pengambilan_simpanan_sukarela),
                 transaksi_pengambilan_simpanan_wisata: parseNumber(row.transaksi_pengambilan_simpanan_wisata),
                 transaksi_penambahan_pinjaman_berjangka: parseNumber(row.transaksi_penambahan_pinjaman_berjangka),
                 transaksi_penambahan_pinjaman_khusus: parseNumber(row.transaksi_penambahan_pinjaman_khusus),
                 transaksi_penambahan_pinjaman_niaga: parseNumber(row.transaksi_penambahan_pinjaman_niaga),
            })).filter(t => t.no_anggota);
            
            if (transaksiList.length === 0) throw new Error("File tidak berisi data transaksi yang valid.");

            const result = await batchProcessTransaksiBulanan(transaksiList, uploadMonth, user?.name);
            if (result.successCount > 0) {
                setUploadHistory(await getUploadedMonths());
            }
            return result;

        } catch (err: any) {
             alert(`Gagal memproses file: ${err.message}`);
             return { successCount: 0, errorCount: 0, errors: [] };
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleDeleteClick = (month: string) => {
        setMonthToDelete(month);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!monthToDelete) return;

        const formattedMonth = new Date(`${monthToDelete}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric'});
        
        setIsDeleting(monthToDelete);
        setIsDeleteModalOpen(false);

        try {
            await deleteMonthlyReport(monthToDelete);
            setUploadHistory(prev => prev.filter(m => m !== monthToDelete));
            alert(`Data untuk bulan ${formattedMonth} berhasil dihapus.`);
        } catch (error) {
            console.error("Failed to delete monthly report:", error);
            alert("Terjadi kesalahan saat menghapus data. Silakan coba lagi.");
        } finally {
            setIsDeleting(null);
            setMonthToDelete(null);
        }
    };

    const handleRebuildHistory = async () => {
        setIsRebuilding(true);
        try {
            const updatedMonths = await rebuildUploadHistory();
            setUploadHistory(updatedMonths);
            alert('Riwayat berhasil dipindai dan diperbarui!');
        } catch (error) {
            console.error("Failed to rebuild history:", error);
            alert('Gagal memindai riwayat. Silakan coba lagi.');
        } finally {
            setIsRebuilding(false);
        }
    };

    const handleDownloadReport = async () => {
        setIsDownloading(true);
        try {
            const keuanganList = await getKeuangan();
            if (keuanganList.length === 0) {
                alert('Tidak ada data keuangan untuk diunduh.');
                return;
            }
            keuanganList.sort((a, b) => a.no_anggota.localeCompare(b.no_anggota));

             const dataToExport = keuanganList.map(k => ({
                'No Anggota': k.no_anggota,
                'Nama': k.nama_angota,
                'Periode Laporan Terakhir': k.periode || '',
                'Akhir Simpanan Pokok': k.akhir_simpanan_pokok,
                'Akhir Simpanan Wajib': k.akhir_simpanan_wajib,
                'Akhir Simpanan Sukarela': k.akhir_simpanan_sukarela,
                'Akhir Simpanan Wisata': k.akhir_simpanan_wisata,
                'Total Simpanan': k.jumlah_total_simpanan,
                'Akhir Pinjaman Berjangka': k.akhir_pinjaman_berjangka,
                'Akhir Pinjaman Khusus': k.akhir_pinjaman_khusus,
                'Total Pinjaman': k.jumlah_total_pinjaman,
            }));
            
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");

            const today = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `Laporan_Keuangan_Koperasi_${today}.xlsx`);

        } catch (error) {
            console.error("Gagal mengunduh laporan:", error);
            alert("Terjadi kesalahan saat menyiapkan file unduhan.");
        } finally {
            setIsDownloading(false);
        }
    };

    const anggotaInstructions = `kode_anggota, nama_anggota, no_hp`;
    const keuanganAwalInstructions = `no, no_anggota, nama_angota, awal_simpanan_pokok, awal_simpanan_wajib, sukarela, awal_simpanan_wisata, awal_pinjaman_berjangka, awal_pinjaman_khusus, transaksi_simpanan_pokok, transaksi_simpanan_wajib, transaksi_simpanan_sukarela, transaksi_simpanan_wisata, transaksi_pinjaman_berjangka, transaksi_pinjaman_khusus, transaksi_simpanan_jasa, transaksi_niaga, transaksi_dana_perlaya, transaksi_dana_katineng, Jumlah_setoran, transaksi_pengambilan_simpanan_pokok, transaksi_pengambilan_simpanan_wajib, transaksi_pengambilan_simpanan_sukarela, transaksi_pengambilan_simpanan_wisata, transaksi_penambahan_pinjaman_berjangka, transaksi_penambahan_pinjaman_khusus, transaksi_penambahan_pinjaman_niaga, akhir_simpanan_pokok, akhir_simpanan_wajib, akhir_simpanan_sukarela, akhir_simpanan_wisata, akhir_pinjaman_berjangka, akhir_pinjaman_khusus, jumlah_total_simpanan, jumlah_total_pinjaman`;
    const transaksiBulananInstructions = `no_anggota, nama_angota, transaksi_simpanan_pokok, transaksi_simpanan_wajib, transaksi_simpanan_sukarela, transaksi_simpanan_wisata, transaksi_pinjaman_berjangka, transaksi_pinjaman_khusus, transaksi_simpanan_jasa, transaksi_niaga, transaksi_dana_perlaya, transaksi_dana_katineng, Jumlah_setoran, transaksi_pengambilan_simpanan_pokok, transaksi_pengambilan_simpanan_wajib, transaksi_pengambilan_simpanan_sukarela, transaksi_pengambilan_simpanan_wisata, transaksi_penambahan_pinjaman_berjangka, transaksi_penambahan_pinjaman_khusus, transaksi_penambahan_pinjaman_niaga`;
    
    const handleDownloadTemplate = (type: 'anggota') => {
        let headers: string[] = [];
        let filename = '';
        
        switch (type) {
            case 'anggota':
                headers = anggotaInstructions.split(', ');
                filename = 'Template_Data_Anggota.xlsx';
                break;
        }

        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, filename);
    };

    return (
        <div>
            <Header title="Upload Data Massal" />
            <UploadSection 
                title="1. Upload Data Anggota"
                instructions={anggotaInstructions}
                onFileUpload={handleAnggotaUpload}
                disabled={isUploading}
                templateType="anggota"
                onDownloadTemplate={handleDownloadTemplate}
            />
            <UploadSection 
                title="2. Upload Data Awal Keuangan"
                instructions={keuanganAwalInstructions}
                onFileUpload={handleKeuanganAwalUpload}
                disabled={isUploading}
            />
             <div>
                <div className="bg-white p-6 rounded-t-xl shadow-md border-b flex flex-wrap justify-between items-center gap-2">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-dark">3. Upload Data Transaksi Bulanan</h2>
                         <p className="text-sm text-gray-500 mt-1">
                            Pastikan nama sheet pertama berformat <code className="bg-gray-200 px-1 rounded">YYYY MM</code> (contoh: <code className="bg-gray-200 px-1 rounded">2024 07</code>).
                        </p>
                    </div>
                     <button
                        onClick={handleDownloadReport}
                        disabled={isDownloading}
                        className="flex-shrink-0 flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>{isDownloading ? 'Menyiapkan...' : 'Download Laporan Lengkap'}</span>
                    </button>
                </div>
                <UploadSection
                    title=""
                    hideTitle={true}
                    instructions={transaksiBulananInstructions}
                    onFileUpload={handleTransaksiBulananUpload}
                    disabled={isUploading || !!isDeleting}
                />
            </div>
             <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-dark">Riwayat Upload Transaksi Bulanan</h2>
                    <button
                        onClick={handleRebuildHistory}
                        disabled={isRebuilding}
                        className="bg-blue-100 text-primary px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50"
                        title="Pindai data lama dan perbaiki riwayat jika ada yang tidak muncul."
                    >
                        {isRebuilding ? 'Memindai...' : 'Pindai & Perbaiki Riwayat'}
                    </button>
                </div>
                {isHistoryLoading ? (
                    <p className="text-center text-gray-500 py-4">Memuat riwayat...</p>
                ) : uploadHistory.length > 0 ? (
                    <ul className="space-y-3">
                        {uploadHistory.map(month => (
                            <li key={month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <span className="font-medium text-gray-800">
                                    {new Date(`${month}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric'})}
                                </span>
                                <button
                                    onClick={() => handleDeleteClick(month)}
                                    disabled={isDeleting === month}
                                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold disabled:text-gray-400 disabled:cursor-wait"
                                >
                                    {isDeleting === month ? 'Menghapus...' : <><TrashIcon className="w-4 h-4" /> Hapus</>}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-4">Belum ada riwayat upload.</p>
                )}
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Konfirmasi Hapus Data"
            >
                <div>
                    <p className="text-gray-700 mb-4">
                        Apakah Anda yakin ingin menghapus semua data transaksi untuk bulan <span className="font-bold">{monthToDelete && new Date(`${monthToDelete}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric'})}</span>?
                    </p>
                    <p className="text-sm bg-red-50 text-red-800 p-3 rounded-lg">
                        <strong>Peringatan:</strong> Tindakan ini akan menghapus semua data transaksi untuk bulan yang dipilih dan mengembalikan saldo anggota ke kondisi bulan sebelumnya. Aksi ini tidak dapat diurungkan.
                    </p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                            Ya, Hapus Data
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminUpload;