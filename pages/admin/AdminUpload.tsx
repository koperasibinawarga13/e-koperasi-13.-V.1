// FIX: Implemented full content for AdminUpload.tsx to create the file upload page.
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
// FIX: Import the 'xlsx' library to handle Excel file parsing.
import * as XLSX from 'xlsx';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import { UploadIcon } from '../../components/icons/Icons';
import { batchAddAnggota } from '../../services/anggotaService';
import { Anggota } from '../../types';

const AdminUpload: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
        setUploadStatus('idle');
        setUploadProgress(0);
        setErrorMessage('');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
        maxFiles: 1,
    });

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);
        setUploadStatus('idle');
        setUploadProgress(10); // Initial progress

        const file = files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);
                setUploadProgress(30);

                if (json.length === 0) {
                    throw new Error("File Excel kosong atau format tidak sesuai.");
                }

                const anggotaList: Omit<Anggota, 'id'>[] = json.map(row => ({
                    no_anggota: String(row.no_anggota || ''),
                    password: String(row.password || ''),
                    nama: String(row.nama || ''),
                    nik: String(row.nik || ''),
                    alamat: String(row.alamat || ''),
                    no_telepon: String(row.no_telepon || ''),
                    email: String(row.email || ''),
                    tanggal_bergabung: String(row.tanggal_bergabung || new Date().toISOString().split('T')[0]),
                    status: row.status === 'Aktif' ? 'Aktif' : 'Tidak Aktif',
                }));
                setUploadProgress(50);
                
                await batchAddAnggota(anggotaList);
                setUploadProgress(100);
                setUploadStatus('success');
            } catch (err: any) {
                setUploadStatus('error');
                setErrorMessage(err.message || 'Gagal memproses file.');
                console.error(err);
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    const removeFile = () => {
        setFiles([]);
        setUploadProgress(0);
        setUploadStatus('idle');
        setErrorMessage('');
    }

    return (
        <div>
            <Header title="Upload Data Anggota" />
            <div className="bg-white p-8 rounded-xl shadow-md max-w-3xl mx-auto">
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-blue-800">Petunjuk Upload</h3>
                    <p className="text-sm text-blue-700 mt-2">
                        Pastikan file Excel (.xlsx) Anda memiliki kolom header berikut:
                        <code className="block bg-blue-100 p-2 rounded-md text-xs mt-2">
                           no_anggota, password, nama, nik, alamat, no_telepon, email, tanggal_bergabung, status
                        </code>
                        Nilai untuk kolom `status` harus 'Aktif' atau 'Tidak Aktif'.
                    </p>
                </div>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'}`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center">
                        <UploadIcon className="w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-gray-600">
                            Seret & jatuhkan file .xlsx di sini, atau <span className="text-primary font-semibold">klik untuk memilih file</span>
                        </p>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-6">
                        <div className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                            <span className="text-sm text-gray-700">{files[0].name}</span>
                            <button onClick={removeFile} className="text-red-500 hover:text-red-700 text-sm font-semibold">Hapus</button>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="w-full mt-4 bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400"
                        >
                            {isUploading ? 'Mengunggah...' : 'Mulai Unggah'}
                        </button>
                    </div>
                )}

                {(isUploading || uploadProgress > 0) && (
                    <div className="mt-6">
                        <ProgressBar progress={uploadProgress} />
                        {uploadStatus === 'success' && <p className="text-green-600 mt-2 text-center font-semibold">Upload berhasil!</p>}
                        {uploadStatus === 'error' && <p className="text-red-600 mt-2 text-center font-semibold">Upload gagal: {errorMessage}</p>}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminUpload;