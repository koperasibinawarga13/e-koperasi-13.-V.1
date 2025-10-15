// FIX: Implemented full content for AdminUpload.tsx to create the file upload page.
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
// FIX: Import the 'xlsx' library to handle Excel file parsing.
import * as XLSX from 'xlsx';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import { UploadIcon } from '../../components/icons/Icons';
import { batchAddAnggota } from '../../services/anggotaService';
import { batchUpsertKeuangan, batchProcessTransaksiBulanan } from '../../services/keuanganService';
import { Anggota, Keuangan, TransaksiBulanan } from '../../types';

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
}> = ({ title, instructions, onFileUpload, disabled }) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<UploadResult | null>(null);

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
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-bold text-dark mb-4">{title}</h2>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-800">Struktur File Excel (.xlsx)</h3>
                <p className="text-sm text-blue-700 mt-2">Pastikan file Anda memiliki kolom header berikut (urutan dan nama harus sesuai):</p>
                <code className="block bg-blue-100 p-2 rounded-md text-xs mt-2 whitespace-pre-wrap">{instructions}</code>
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
    const [isUploading, setIsUploading] = useState(false);

    const readFile = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json: any[] = XLSX.utils.sheet_to_json(worksheet);
                    resolve(json);
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
            const json = await readFile(file);
            const anggotaList = json.map(row => ({
                no_anggota: String(row.kode_anggota || ''),
                nama: String(row.nama_anggota || ''),
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
            const json = await readFile(file);
            const keuanganList: Keuangan[] = json.map(row => ({
                no: parseNumber(row.no),
                no_anggota: String(row.no_anggota || ''),
                nama_angota: String(row.nama_angota || ''),
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
            const json = await readFile(file);
            const transaksiList: TransaksiBulanan[] = json.map(row => ({
                 no_anggota: String(row.no_anggota || ''),
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

            return await batchProcessTransaksiBulanan(transaksiList);
        } catch (err: any) {
             alert(`Gagal memproses file: ${err.message}`);
             return { successCount: 0, errorCount: 0, errors: [] };
        } finally {
            setIsUploading(false);
        }
    };

    const anggotaInstructions = `kode_anggota, nama_anggota, no_hp`;
    const keuanganAwalInstructions = `no, no_anggota, nama_angota, awal_simpanan_pokok, awal_simpanan_wajib, sukarela, awal_simpanan_wisata, awal_pinjaman_berjangka, awal_pinjaman_khusus, transaksi_simpanan_pokok, transaksi_simpanan_wajib, transaksi_simpanan_sukarela, transaksi_simpanan_wisata, transaksi_pinjaman_berjangka, transaksi_pinjaman_khusus, transaksi_simpanan_jasa, transaksi_niaga, transaksi_dana_perlaya, transaksi_dana_katineng, Jumlah_setoran, transaksi_pengambilan_simpanan_pokok, transaksi_pengambilan_simpanan_wajib, transaksi_pengambilan_simpanan_sukarela, transaksi_pengambilan_simpanan_wisata, transaksi_penambahan_pinjaman_berjangka, transaksi_penambahan_pinjaman_khusus, transaksi_penambahan_pinjaman_niaga, akhir_simpanan_pokok, akhir_simpanan_wajib, akhir_simpanan_sukarela, akhir_simpanan_wisata, akhir_pinjaman_berjangka, akhir_pinjaman_khusus, jumlah_total_simpanan, jumlah_total_pinjaman`;
    const transaksiBulananInstructions = `no_anggota, transaksi_simpanan_pokok, transaksi_simpanan_wajib, transaksi_simpanan_sukarela, transaksi_simpanan_wisata, transaksi_pinjaman_berjangka, transaksi_pinjaman_khusus, transaksi_simpanan_jasa, transaksi_niaga, transaksi_dana_perlaya, transaksi_dana_katineng, Jumlah_setoran, transaksi_pengambilan_simpanan_pokok, transaksi_pengambilan_simpanan_wajib, transaksi_pengambilan_simpanan_sukarela, transaksi_pengambilan_simpanan_wisata, transaksi_penambahan_pinjaman_berjangka, transaksi_penambahan_pinjaman_khusus, transaksi_penambahan_pinjaman_niaga`;

    return (
        <div>
            <Header title="Upload Data Massal" />
            <UploadSection 
                title="1. Upload Data Anggota"
                instructions={anggotaInstructions}
                onFileUpload={handleAnggotaUpload}
                disabled={isUploading}
            />
            <UploadSection 
                title="2. Upload Data Awal Keuangan"
                instructions={keuanganAwalInstructions}
                onFileUpload={handleKeuanganAwalUpload}
                disabled={isUploading}
            />
            <UploadSection 
                title="3. Upload Data Transaksi Bulanan"
                instructions={transaksiBulananInstructions}
                onFileUpload={handleTransaksiBulananUpload}
                disabled={isUploading}
            />
        </div>
    );
};

export default AdminUpload;