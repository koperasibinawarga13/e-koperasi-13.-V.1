import React, { useState, useEffect } from 'react';
import { Anggota } from '../types';

interface AnggotaFormProps {
  onSubmit: (anggota: Omit<Anggota, 'id'> | Anggota) => void;
  onCancel: () => void;
  initialData?: Anggota | null;
}

const AnggotaForm: React.FC<AnggotaFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    nomorAnggota: '',
    nama: '',
    nik: '',
    alamat: '',
    telepon: '',
    tanggalMasuk: '',
    status: 'Aktif' as 'Aktif' | 'Tidak Aktif',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nomorAnggota: initialData.nomorAnggota,
        nama: initialData.nama,
        nik: initialData.nik,
        alamat: initialData.alamat,
        telepon: initialData.telepon,
        tanggalMasuk: initialData.tanggalMasuk,
        status: initialData.status,
      });
    } else {
        // Reset form when adding new
        setFormData({
            nomorAnggota: '',
            nama: '',
            nik: '',
            alamat: '',
            telepon: '',
            tanggalMasuk: '',
            status: 'Aktif'
        });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(initialData) {
        onSubmit({ ...initialData, ...formData });
    } else {
        onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nomor Anggota</label>
          <input type="text" name="nomorAnggota" value={formData.nomorAnggota} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
          <input type="text" name="nama" value={formData.nama} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">NIK</label>
          <input type="text" name="nik" value={formData.nik} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
          <input type="text" name="telepon" value={formData.telepon} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
         <div className="mb-4 col-span-2">
          <label className="block text-sm font-medium text-gray-700">Alamat</label>
          <textarea name="alamat" value={formData.alamat} onChange={handleChange} required rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Tanggal Masuk</label>
          <input type="date" name="tanggalMasuk" value={formData.tanggalMasuk} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
          Batal
        </button>
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
          {initialData ? 'Update' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};

export default AnggotaForm;
