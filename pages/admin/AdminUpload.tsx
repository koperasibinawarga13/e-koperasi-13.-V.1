
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import { UploadIcon } from '../../components/icons/Icons';

const AdminUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
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
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setFiles([]);
          // You could show a success message here
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
      <div className="bg-white p-8 rounded-xl shadow-md max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-dark mb-4">Upload Data Anggota atau Transaksi</h2>
        <p className="text-gray-600 mb-6">
          Anda dapat mengunggah data dalam format CSV, XLS, atau XLSX. Pastikan file sesuai dengan template yang telah ditentukan.
        </p>
        
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-primary'}`}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-primary font-semibold">Jatuhkan file di sini...</p>
            ) : (
              <p className="text-gray-500">Seret & jatuhkan file di sini, atau klik untuk memilih file</p>
            )}
            <p className="text-xs text-gray-400 mt-2">Mendukung: CSV, XLS, XLSX</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-dark mb-2">File yang akan diupload:</h3>
            <ul>
              {files.map(file => (
                <li key={file.name} className="flex justify-between items-center bg-gray-100 p-3 rounded-md mb-2">
                  <span className="text-sm font-medium text-gray-700">{file.name} - {(file.size / 1024).toFixed(2)} KB</span>
                  <button onClick={() => removeFile(file.name)} className="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploading && (
          <div className="mt-6">
            <ProgressBar progress={uploadProgress} />
            <p className="text-center text-sm text-gray-600 mt-2">{uploadProgress}%</p>
          </div>
        )}

        <div className="mt-8 text-right">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Mengunggah...' : 'Mulai Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;
