import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import { UploadIcon } from '../../components/icons/Icons';

const AdminUpload: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
        setUploadStatus('');
        setUploadProgress(0);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
        maxFiles: 1,
    });
    
    const handleUpload = () => {
        if (files.length === 0) {
            setUploadStatus('Pilih file terlebih dahulu.');
            return;
        }
        setIsUploading(true);
        setUploadStatus('Mengunggah file...');
        
        // Mock upload progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsUploading(false);
                    setUploadStatus(`File '${files[0].name}' berhasil diunggah.`);
                    setFiles([]);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    return (
        <div>
            <Header title="Upload Data" />
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-dark mb-4">Upload Data Anggota atau Transaksi</h2>
                <p className="text-gray-600 mb-6">Pilih file CSV, XLS, atau XLSX untuk diimpor ke dalam sistem.</p>
                
                <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300'}`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center">
                        <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
                        {isDragActive ? (
                            <p className="text-lg text-primary font-semibold">Jatuhkan file di sini...</p>
                        ) : (
                            <p className="text-gray-500">Seret &amp; jatuhkan file di sini, atau klik untuk memilih file</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Hanya file .csv, .xls, .xlsx yang didukung</p>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-semibold">File terpilih:</h3>
                        <ul>
                            {files.map(file => <li key={file.name}>{file.name} - {(file.size / 1024).toFixed(2)} KB</li>)}
                        </ul>
                    </div>
                )}
                
                <div className="mt-8">
                    <button 
                        onClick={handleUpload} 
                        disabled={isUploading || files.length === 0}
                        className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Mengunggah...' : 'Upload File'}
                    </button>
                </div>

                {isUploading && (
                    <div className="mt-6">
                        <ProgressBar progress={uploadProgress} />
                    </div>
                )}
                
                {uploadStatus && (
                    <p className={`mt-4 text-sm ${uploadStatus.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>{uploadStatus}</p>
                )}
            </div>
        </div>
    );
};

export default AdminUpload;
