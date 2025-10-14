// FIX: Implement the AdminUpload component for file uploads.
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import { UploadIcon } from '../../components/icons/Icons';

const AdminUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setUploadSuccess(false);
    setUploadProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] }
  });

  const handleUpload = () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadSuccess(false);

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

  const removeFile = (file: File) => {
    setFiles(files.filter(f => f !== file));
  };
  
  return (
    <div>
      <Header title="Upload Data" />
      <div className="bg-white p-8 rounded-xl shadow-md max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-dark mb-4">Upload Data Anggota atau Transaksi</h2>
        <p className="text-gray-500 mb-6">Silakan unggah file dalam format .csv. Pastikan format kolom sesuai dengan template yang disediakan.</p>
        
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center text-gray-500">
            <UploadIcon className="w-12 h-12 mb-4" />
            {isDragActive ?
              <p>Lepaskan file di sini...</p> :
              <p>Tarik &amp; lepas file di sini, atau klik untuk memilih file</p>
            }
             <p className="text-xs mt-2">Hanya file *.csv yang diterima</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">File yang akan diupload:</h3>
            <ul>
              {files.map(file => (
                <li key={file.name} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                  <span>{file.name} - {(file.size / 1024).toFixed(2)} KB</span>
                  <button onClick={() => removeFile(file)} className="text-red-500 font-bold">X</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isUploading && (
          <div className="mt-6">
            <ProgressBar progress={uploadProgress} />
          </div>
        )}

        {uploadSuccess && (
            <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg">
                File berhasil diupload dan sedang diproses.
            </div>
        )}

        <div className="mt-8 text-right">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Mengunggah...' : 'Mulai Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;
