// FIX: Implement the AnggotaForm component for adding/editing members.
import React, { useState, useEffect } from 'react';
import { Anggota } from '../types';

interface AnggotaFormProps {
  onSubmit: (data: Omit<Anggota, 'id'> | Anggota) => void;
  onCancel: () => void;
  initialData?: Anggota | null;
}

const AnggotaForm: React.FC<AnggotaFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    joinDate: '',
    phone: '',
    address: '',
    totalSimpanan: 0,
    totalPinjaman: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
          name: initialData.name,
          email: initialData.email,
          joinDate: initialData.joinDate,
          phone: initialData.phone,
          address: initialData.address,
          totalSimpanan: initialData.totalSimpanan,
          totalPinjaman: initialData.totalPinjaman,
      });
    } else {
        // Reset form for new entry
        setFormData({
            name: '',
            email: '',
            joinDate: new Date().toISOString().split('T')[0], // default to today
            phone: '',
            address: '',
            totalSimpanan: 0,
            totalPinjaman: 0,
        });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      onSubmit({ ...initialData, ...formData });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">No. Telepon</label>
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
         <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat</label>
            <textarea name="address" id="address" value={formData.address} onChange={handleChange} required rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">
            Batal
            </button>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Simpan
            </button>
        </div>
    </form>
  );
};

export default AnggotaForm;
