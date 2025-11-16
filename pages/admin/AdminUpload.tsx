// FIX: Implemented full content for AdminUpload.tsx to create the file upload page.
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
// FIX: Import the 'xlsx' library to handle Excel file parsing.
import * as XLSX from 'xlsx';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import Modal from '../../components/Modal';
import { UploadIcon, TrashIcon, DownloadIcon, ChevronDownIcon } from '../../components/icons/Icons';
import { batchUpsertAnggota } from '../../services/anggotaService';
import { batchUpsertKeuangan, batchProcessTransaksiBulanan, getUploadedMonths, deleteMonthlyReport, rebuildUploadHistory, getKeuangan, resetAllFinancialData } from '../../services/keuanganService';
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
        <div className={`bg-surface p-6 ${hideTitle ? 'pt-0 rounded-b-xl' : 'rounded-xl'} mb-8`}>
            {!hideTitle && (
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-dark">{title}</h2>
                    {templateType && onDownloadTemplate && (
                        <button 
                            onClick={() => onDownloadTemplate(templateType)}
                            className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-500/20 transition-colors"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            <span>Download Template</span>
                        </button>
                    )}
                </div>
            )}
            <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
                <button 
                    onClick={() => setIsInstructionsVisible(!isInstructionsVisible)}
                    className="w-full flex justify-between items-center text-left"
                    aria-expanded={isInstructionsVisible}
                >
                    <h3 className="font-bold text-dark">Struktur File Excel (.xlsx)</h3>
                    <ChevronDownIcon className={`w-5 h-5 text-dark transition-transform duration-300 ${isInstructionsVisible ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isInstructionsVisible ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                    <p className="text-sm text-gray-text mt-2">Pastikan file Anda memiliki kolom header berikut (urutan dan nama harus sesuai):</p>
                    <code className="block bg-zinc-900 p-2 rounded-md text-xs mt-2 whitespace-pre-wrap text-zinc-400">{instructions}</code>
                </div>
            </div>
            
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/10' : 'border-zinc-700 hover:border-primary'}`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                    <UploadIcon className="w-12 h-12 text-zinc-600 mb-3" />
                    <p className="text-gray-text">
                        Seret & jatuhkan file di sini, atau <span className="text-primary font-semibold">klik untuk memilih</span>
                    </p>
                </div>
            </div>

            {file && (
                <div className="mt-6">
                    <div className="p-3 bg-zinc-800 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-dark">{file.name}</span>
                        <button onClick={removeFile} disabled={disabled} className="text-red-500 hover:text-red-400 text-sm font-semibold disabled:text-zinc-600">Hapus</button>
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={disabled || status === 'processing'}
                        className="w-full mt-4 bg-primary text-black py-3 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-zinc-700 disabled:text-zinc-400"
                    >
                        {status === 'processing' ? 'Memproses...' : 'Mulai Unggah'}
                    </button>
                </div>
            )}
            
            {status !== 'idle' && (
                 <div className="mt-6">
                    <ProgressBar progress={progress} />
                    {status === 'success' && <p className="text-green-400 mt-2 text-center font-semibold">Proses unggah selesai! {result ? `${result.successCount} data berhasil diproses.` : ''}</p>}
                    {status === 'error' && result && (
                        <div className="text-red-400 mt-2 text-center font-semibold">
                            <p>Proses selesai dengan {result.errorCount} kesalahan.</p>
                             {result.successCount > 0 && <p className="text-green-400">{result.successCount} data berhasil diproses.</p>}
                             <details className="text-xs text-left mt-2 bg-red-500/10 p-2 rounded">
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
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);


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
                no_anggota: String(row.kode_anggota || '').trim().toUpperCase(),
                nama: String(row.nama_anggota || '').trim(),
                no_telepon: String(row.no_hp || ''),
            })).filter(a => a.no_anggota && a.nama);

            if (anggotaList.length === 0) throw new Error("File tidak berisi data anggota yang valid.");
            
            await batchUpsertAnggota(anggotaList);
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
            const keuanganList: Keuangan[] = json.map(row => {
                const rawData = {
                    no: parseNumber(row.no),
                    no_anggota: String(row.no_anggota || '').trim(),
                    nama_angota: String(row.nama_angota || '').trim(),
                    awal_simpanan_pokok: parseNumber(row.awal_simpanan_pokok),
                    awal_simpanan_wajib: parseNumber(row.awal_simpanan_wajib),
                    sukarela: parseNumber(row.sukarela),
                    awal_simpanan_wisata: parseNumber(row.awal_simpanan_wisata),
                    awal_pinjaman_berjangka: parseNumber(row.awal_pinjaman_berjangka),
                    awal_pinjaman_khusus: parseNumber(row.awal_pinjaman_khusus),
                    awal_pinjaman_niaga: parseNumber(row.awal_pinjaman_niaga),
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
                };
    
                // FIX: Perform explicit calculation for initial data upload instead of reusing the incremental transaction logic.
                // This correctly calculates final balances based on the 'awal_*' and 'transaksi_*' columns from the uploaded file.
                const akhir_simpanan_pokok = rawData.awal_simpanan_pokok + rawData.transaksi_simpanan_pokok - rawData.transaksi_pengambilan_simpanan_pokok;
                const akhir_simpanan_wajib = rawData.awal_simpanan_wajib + rawData.transaksi_simpanan_wajib - rawData.transaksi_pengambilan_simpanan_wajib;
                const akhir_simpanan_sukarela = rawData.sukarela + rawData.transaksi_simpanan_sukarela - rawData.transaksi_pengambilan_simpanan_sukarela;
                const akhir_simpanan_wisata = rawData.awal_simpanan_wisata + rawData.transaksi_simpanan_wisata - rawData.transaksi_pengambilan_simpanan_wisata;
            
                const akhir_pinjaman_berjangka = rawData.awal_pinjaman_berjangka - rawData.transaksi_pinjaman_berjangka + rawData.transaksi_penambahan_pinjaman_berjangka;
                const akhir_pinjaman_khusus = rawData.awal_pinjaman_khusus - rawData.transaksi_pinjaman_khusus + rawData.transaksi_penambahan_pinjaman_khusus;
                const akhir_pinjaman_niaga = rawData.awal_pinjaman_niaga - rawData.transaksi_niaga + rawData.transaksi_penambahan_pinjaman_niaga;

                const jumlah_total_simpanan = akhir_simpanan_pokok + akhir_simpanan_wajib + akhir_simpanan_sukarela + akhir_simpanan_wisata;
                const jumlah_total_pinjaman = akhir_pinjaman_berjangka + akhir_pinjaman_khusus + akhir_pinjaman_niaga;
    
                return {
                    ...rawData,
                    akhir_simpanan_pokok,
                    akhir_simpanan_wajib,
                    akhir_simpanan_sukarela,
                    akhir_simpanan_wisata,
                    akhir_pinjaman_berjangka,
                    akhir_pinjaman_khusus,
                    akhir_pinjaman_niaga,
                    jumlah_total_simpanan,
                    jumlah_total_pinjaman,
                } as Keuangan;
            }).filter(k => k.no_anggota);
            
            if (keuanganList.length === 0) throw new Error("File tidak berisi data keuangan yang valid.");
            
            await batchUpsertKeuangan(keuanganList);
            alert('Data awal keuangan berhasil diunggah dan semua saldo akhir telah dihitung ulang oleh sistem.');
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
    
    const handleResetKeuangan = async () => {
        setIsResetting(true);
        setIsResetModalOpen(false);
        try {
            await resetAllFinancialData();
            alert('Semua data keuangan, riwayat, dan log transaksi berhasil dihapus dan direset.');
            setUploadHistory([]); // Clear history from UI state
        } catch (error) {
            console.error("Failed to reset financial data:", error);
            alert('Terjadi kesalahan saat mereset data. Silakan coba lagi.');
        } finally {
            setIsResetting(false);
        }
    };

    const anggotaInstructions = `kode_anggota, nama_anggota, no_hp`;
    const keuanganAwalInstructions = `no, no_anggota, nama_angota, awal_simpanan_pokok, awal_simpanan_wajib, sukarela, awal_simpanan_wisata, awal_pinjaman_berjangka, awal_pinjaman_khusus, awal_pinjaman_niaga, transaksi_simpanan_pokok, transaksi_simpanan_wajib, transaksi_simpanan_sukarela, transaksi_simpanan_wisata, transaksi_pinjaman_berjangka, transaksi_pinjaman_khusus, transaksi_simpanan_jasa, transaksi_niaga, transaksi_dana_perlaya, transaksi_dana_katineng, Jumlah_setoran, transaksi_pengambilan_simpanan_pokok, transaksi_pengambilan_simpanan_wajib, transaksi_pengambilan_simpanan_sukarela, transaksi_pengambilan_simpanan_wisata, transaksi_penambahan_pinjaman_berjangka, transaksi_penambahan_pinjaman_khusus, transaksi_penambahan_pinjaman_niaga, akhir_simpanan_pokok, akhir_simpanan_wajib, akhir_simpanan_sukarela, akhir_simpanan_wisata, akhir_pinjaman_berjangka, akhir_pinjaman_khusus, akhir_pinjaman_niaga, jumlah_total_simpanan, jumlah_total_pinjaman`;
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
            
            <div>
                 <div className="bg-surface p-6 rounded-t-xl flex flex-wrap justify-between items-center gap-2">
                    <h2 className="text-lg md:text-xl font-bold text-dark">2. Upload Data Awal Keuangan</h2>
                    <button
                        onClick={() => setIsResetModalOpen(true)}
                        disabled={isUploading || isResetting}
                        className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:bg-zinc-700"
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span>{isResetting ? 'Mereset...' : 'Reset Semua Data Keuangan'}</span>
                    </button>
                </div>
                <UploadSection 
                    title=""
                    hideTitle={true}
                    instructions={keuanganAwalInstructions}
                    onFileUpload={handleKeuanganAwalUpload}
                    disabled={isUploading || isResetting}
                />
            </div>

             <div>
                <div className="bg-surface p-6 rounded-t-xl flex flex-wrap justify-between items-center gap-2">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-dark">3. Upload Data Transaksi Bulanan</h2>
                         <p className="text-sm text-gray-text mt-1">
                            Pastikan nama sheet pertama berformat <code className="bg-zinc-700 px-1 rounded">YYYY MM</code> (contoh: <code className="bg-zinc-700 px-1 rounded">2024 07</code>).
                        </p>
                    </div>
                     <button
                        onClick={handleDownloadReport}
                        disabled={isDownloading}
                        className="flex-shrink-0 flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:bg-zinc-700"
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
             <div className="mt-8 bg-surface p-6 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-dark">Riwayat Upload Transaksi Bulanan</h2>
                    <button
                        onClick={handleRebuildHistory}
                        disabled={isRebuilding}
                        className="bg-zinc-700 text-dark px-3 py-1 rounded-lg text-sm font-semibold hover:bg-zinc-600 transition-colors disabled:opacity-50"
                        title="Pindai data lama dan perbaiki riwayat jika ada yang tidak muncul."
                    >
                        {isRebuilding ? 'Memindai...' : 'Pindai & Perbaiki Riwayat'}
                    </button>
                </div>
                {isHistoryLoading ? (
                    <p className="text-center text-gray-text py-4">Memuat riwayat...</p>
                ) : uploadHistory.length > 0 ? (
                    <ul className="space-y-3">
                        {uploadHistory.map(month => (
                            <li key={month} className="flex justify-between items-center p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
                                <span className="font-medium text-dark">
                                    {new Date(`${month}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric'})}
                                </span>
                                <button
                                    onClick={() => handleDeleteClick(month)}
                                    disabled={isDeleting === month}
                                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 font-semibold disabled:text-zinc-600 disabled:cursor-wait"
                                >
                                    {isDeleting === month ? 'Menghapus...' : <><TrashIcon className="w-4 h-4" /> Hapus</>}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-text py-4">Belum ada riwayat upload.</p>
                )}
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Konfirmasi Hapus Data"
            >
                <div>
                    <p className="text-dark mb-4">
                        Apakah Anda yakin ingin menghapus semua data transaksi untuk bulan <span className="font-bold">{monthToDelete && new Date(`${monthToDelete}-02`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric'})}</span>?
                    </p>
                    <p className="text-sm bg-red-500/10 text-red-400 p-3 rounded-lg">
                        <strong>Peringatan:</strong> Tindakan ini akan menghapus semua data transaksi untuk bulan yang dipilih dan mengembalikan saldo anggota ke kondisi bulan sebelumnya. Aksi ini tidak dapat diurungkan.
                    </p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="bg-zinc-700 text-dark px-4 py-2 rounded-lg font-semibold hover:bg-zinc-600 transition-colors"
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
            
            <Modal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                title="Konfirmasi Reset Semua Data Keuangan"
            >
                <div>
                    <p className="text-dark mb-4">
                        Apakah Anda yakin ingin melanjutkan?
                    </p>
                    <div className="text-sm bg-red-500/10 text-red-400 p-3 rounded-lg">
                        <p><strong>Peringatan Sangat Penting:</strong></p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Semua data saldo (simpanan & pinjaman) akan menjadi <strong>NOL</strong>.</li>
                            <li>Semua riwayat transaksi bulanan akan <strong>DIHAPUS</strong>.</li>
                            <li>Semua log transaksi manual akan <strong>DIHAPUS</strong>.</li>
                            <li>Data anggota (nama, no. anggota) <strong>TIDAK</strong> akan terhapus.</li>
                        </ul>
                        <p className="mt-2 font-bold">Aksi ini tidak dapat diurungkan.</p>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={() => setIsResetModalOpen(false)}
                            className="bg-zinc-700 text-dark px-4 py-2 rounded-lg font-semibold hover:bg-zinc-600 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleResetKeuangan}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                            Ya, Reset Semua Data
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default AdminUpload;