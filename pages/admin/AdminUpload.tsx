import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import { UploadIcon } from '../../components/icons/Icons';

const AdminUpload: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
        setUploadSuccess(false);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        }
    });

    const handleUpload = () => {
        if (files.length === 0) return;
        setIsUploading(true);
        setUploadSuccess(false);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsUploading(false);
                    setUploadSuccess(true);
                    setFiles([]);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };
    
    const removeFile = (fileName: string) => {
        setFiles(files.filter(file => file.name !== fileName));
    };

    return (
        <div>
            <Header title="Upload Data" />
            <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-dark mb-4">Upload File Data Keuangan</h2>
                <p className="text-gray-600 mb-6">Silakan unggah file dalam format .csv, .xls, atau .xlsx untuk memperbarui data keuangan koperasi.</p>
                
                <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center text-gray-500">
                        <UploadIcon className="w-12 h-12 mb-4" />
                        {isDragActive ? (
                            <p>Jatuhkan file di sini ...</p>
                        ) : (
                            <p>Seret & jatuhkan file di sini, atau klik untuk memilih file</p>
                        )}
                        <p className="text-xs mt-2">CSV, XLS, XLSX (MAX. 5MB)</p>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-semibold mb-2">File yang akan diupload:</h3>
                        <ul>
                            {files.map(file => (
                                <li key={file.name} className="flex justify-between items-center bg-gray-100 p-2 rounded mb-2">
                                    <span className="text-sm">{file.name} - {(file.size / 1024).toFixed(2)} KB</span>
                                    <button onClick={() => removeFile(file.name)} className="text-red-500 hover:text-red-700 text-sm font-bold">X</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {isUploading && (
                    <div className="mt-6">
                        <ProgressBar progress={uploadProgress} />
                        <p className="text-center mt-2 text-sm">{uploadProgress}%</p>
                    </div>
                )}

                {uploadSuccess && (
                    <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-center">
                        File berhasil diupload!
                    </div>
                )}

                <div className="mt-8 text-right">
                    <button 
                        onClick={handleUpload}
                        disabled={files.length === 0 || isUploading}
                        className="bg-secondary text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Mengunggah...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminUpload;
