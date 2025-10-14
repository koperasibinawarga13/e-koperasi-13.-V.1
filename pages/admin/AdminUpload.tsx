
import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import ProgressBar from '../../components/ProgressBar';
import { UploadIcon } from '../../components/icons/Icons';

const AdminUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setProgress(0);
      setMessage('');
    }
  };

  const handleUpload = () => {
    if (!file) {
      setMessage('Pilih file terlebih dahulu.');
      return;
    }
    setUploading(true);
    setMessage('');
    setProgress(0);

    intervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setUploading(false);
          setMessage(`File "${file.name}" berhasil diupload.`);
          setFile(null);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div>
      <Header title="Upload Data" />
      <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-dark mb-2">Upload Data Anggota / Keuangan</h2>
        <p className="text-gray-500 mb-6">Silakan pilih file Excel (.xlsx) untuk diimport ke sistem.</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <label htmlFor="file-upload" className="mt-4 block text-sm font-medium text-primary hover:text-blue-700 cursor-pointer">
                <span>Pilih file</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
            </label>
            {file && <p className="text-sm text-gray-500 mt-2">{file.name}</p>}
        </div>

        {file && (
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-secondary text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-400"
            >
              {uploading ? `Mengupload... ${progress}%` : 'Mulai Upload'}
            </button>
          </div>
        )}
        
        {uploading && (
          <div className="mt-6">
            <ProgressBar progress={progress} />
          </div>
        )}

        {message && <p className="mt-4 text-center text-sm font-medium text-green-600">{message}</p>}
      </div>
    </div>
  );
};

export default AdminUpload;
