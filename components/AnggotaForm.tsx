import React, { useState, useEffect } from 'react';
import { Anggota } from '../types';

interface AnggotaFormProps {
  onSave: (anggota: Anggota) => void;
  initialData: Anggota | null;
}

const AnggotaForm: React.FC<AnggotaFormProps> = ({ onSave, initialData }) => {
    const [formData, setFormData] = useState<Omit<Anggota, 'id'>>({
        no_anggota: '',
        nama: '',
        nik: '',
        alamat: '',
        no_telepon: '',
        tanggal_bergabung: new Date().toISOString().split('T')[0],
        status: 'Aktif',
    });

    useEffect(() => {
        if (initialData) {
            const { id, ...data } = initialData;
            setFormData(data);
        } else {
             setFormData({
                no_anggota: '',
                nama: '',
                nik: '',
                alamat: '',
                no_telepon: '',
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
        onSave({
            id: initialData?.id || new Date().getTime().toString(), // Use existing id or generate new one for react key, service will use firestore's
            ...formData,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="no_anggota" className="block text-sm font-medium text-gray-700">No. Anggota</label>
                <input type="text" name="no_anggota" id="no_anggota" value={formData.no_anggota} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
            <div>
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input type="text" name="nama" id="nama" value={formData.nama} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
             <div>
                <label htmlFor="nik" className="block text-sm font-medium text-gray-700">NIK</label>
                <input type="text" name="nik" id="nik" value={formData.nik} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
            <div>
                <label htmlFor="alamat" className="block text-sm font-medium text-gray-700">Alamat</label>
                <textarea name="alamat" id="alamat" value={formData.alamat} onChange={handleChange} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
             <div>
                <label htmlFor="no_telepon" className="block text-sm font-medium text-gray-700">No. Telepon</label>
                <input type="tel" name="no_telepon" id="no_telepon" value={formData.no_telepon} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
            <div>
                <label htmlFor="tanggal_bergabung" className="block text-sm font-medium text-gray-700">Tanggal Bergabung</label>
                <input type="date" name="tanggal_bergabung" id="tanggal_bergabung" value={formData.tanggal_bergabung} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
            </div>
            <div className="flex justify-end pt-4">
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors">Simpan</button>
            </div>
        </form>
    );
};

export default AnggotaForm;
