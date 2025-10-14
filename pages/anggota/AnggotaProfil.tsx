import React, { useState } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon } from '../../components/icons/Icons';

const AnggotaProfil: React.FC = () => {
  const { user } = useAuth();
  // Mock data for profile details, in a real app this would be fetched
  const [profileData, setProfileData] = useState({
    nomorAnggota: 'AGT001',
    nama: user?.name || 'Budi Santoso',
    nik: '3201234567890001',
    alamat: 'Jl. Merdeka No. 1, Jakarta Pusat',
    telepon: '081234567890',
    email: user?.email || 'anggota@koperasi.com',
    tanggalMasuk: '2022-01-15',
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({...prev, [name]: value}));
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would call an API to save the data
    console.log('Saving profile data:', profileData);
    setIsEditing(false);
  }

  return (
    <div>
      <Header title="Profil Saya" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
                <UserCircleIcon className="w-32 h-32 text-gray-300" />
            </div>
            <div className="flex-grow w-full">
                <form onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Nomor Anggota</label>
                            <p className="mt-1 text-lg font-semibold text-dark">{profileData.nomorAnggota}</p>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-500">Tanggal Masuk</label>
                            <p className="mt-1 text-lg font-semibold text-dark">{profileData.tanggalMasuk}</p>
                        </div>
                        <div>
                            <label htmlFor="nama" className="block text-sm font-medium text-gray-500">Nama Lengkap</label>
                            <input type="text" id="nama" name="nama" value={profileData.nama} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full p-2 border rounded-md bg-gray-50 disabled:bg-gray-100 disabled:border-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="nik" className="block text-sm font-medium text-gray-500">NIK</label>
                            <input type="text" id="nik" name="nik" value={profileData.nik} onChange={handleChange} disabled={true} className="mt-1 w-full p-2 border rounded-md bg-gray-100 border-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="telepon" className="block text-sm font-medium text-gray-500">Nomor Telepon</label>
                            <input type="text" id="telepon" name="telepon" value={profileData.telepon} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full p-2 border rounded-md bg-gray-50 disabled:bg-gray-100 disabled:border-gray-200" />
                        </div>
                         <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-500">Email</label>
                            <input type="email" id="email" name="email" value={profileData.email} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full p-2 border rounded-md bg-gray-50 disabled:bg-gray-100 disabled:border-gray-200" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="alamat" className="block text-sm font-medium text-gray-500">Alamat</label>
                            <textarea id="alamat" name="alamat" value={profileData.alamat} onChange={handleChange} disabled={!isEditing} rows={3} className="mt-1 w-full p-2 border rounded-md bg-gray-50 disabled:bg-gray-100 disabled:border-gray-200" />
                        </div>
                    </div>
                    <div className="mt-6 text-right">
                        {isEditing ? (
                            <>
                                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2">
                                    Batal
                                </button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700">
                                    Simpan Perubahan
                                </button>
                            </>
                        ) : (
                            <button type="button" onClick={() => setIsEditing(true)} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-emerald-600">
                                Edit Profil
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnggotaProfil;
