// FIX: Implemented full content for AnggotaForm.tsx to be used in the modal for member management.
import React, { useState, useEffect } from 'react';
import { Anggota } from '../types';

interface AnggotaFormProps {
    onSave: (anggota: Anggota) => void;
    initialData: Anggota | null;
}

const AnggotaForm: React.FC<AnggotaFormProps> = ({ onSave, initialData }) => {
    const [formData, setFormData] = useState<Anggota>({
        id: '',
        no_anggota: '',
        password: '',
        nama: '',
        nik: '',
        alamat: '',
        no_telepon: '',
        email: '',
        tanggal_bergabung: '',
        status: 'Aktif',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({password: '', ...initialData}); // Do not pre-fill password for security
        } else {
            // Reset form for new entry
            setFormData({
                id: `temp-${Date.now()}`, // temporary id
                no_anggota: '',
                password: '',
                nama: '',
                nik: '',
                alamat: '',
                no_telepon: '',
                email: '',
                tanggal_bergabung: new Date().toISOString().split('T')[0],
                status: 'Aktif',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Only include password if it has been changed
        const dataToSave = {...formData};
        if (!dataToSave.password) {
            delete dataToSave.password;
        }
        onSave(dataToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="no_anggota" className="block text-sm font-medium text-gray-700">No. Anggota</label>
                    <input type="text" name="no_anggota" id="no_anggota" value={formData.no_anggota} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                 <div>
                    <label htmlFor="nama" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                    <input type="text" name="nama" id="nama" value={formData.nama} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                 <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} placeholder={initialData ? 'Isi untuk mengubah' : 'Wajib diisi'} required={!initialData} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="nik" className="block text-sm font-medium text-gray-700">NIK</label>
                    <input type="text" name="nik" id="nik" value={formData.nik} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="no_telepon" className="block text-sm font-medium text-gray-700">No. Telepon</label>
                    <input type="tel" name="no_telepon" id="no_telepon" value={formData.no_telepon} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                    </select>
                </div>
            </div>
             <div>
                <label htmlFor="alamat" className="block text-sm font-medium text-gray-700">Alamat</label>
                <textarea name="alamat" id="alamat" value={formData.alamat} onChange={handleChange} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"></textarea>
            </div>
            <div className="flex justify-end pt-4">
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors">
                    Simpan
                </button>
            </div>
        </form>
    );
};

export default AnggotaForm;
