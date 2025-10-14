
import React from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

const AnggotaProfil: React.FC = () => {
    const { user } = useAuth();
  
    const profileData = {
        'ID Anggota': 'B-001',
        'Nama Lengkap': user?.name,
        'Email': user?.email,
        'Tanggal Bergabung': '15 Januari 2022',
        'No. Telepon': '081234567890',
        'Alamat': 'Jl. Merdeka No. 17, Jakarta'
    };

    return (
        <div>
            <Header title="Profil Saya" />
            <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto">
                <div className="flex flex-col items-center mb-8">
                     <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                        <span className="text-4xl font-bold text-primary">
                            {user?.name?.charAt(0)}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-dark">{user?.name}</h2>
                    <p className="text-gray-500">{user?.email}</p>
                </div>
                
                <div className="border-t border-gray-200">
                    <dl>
                        {Object.entries(profileData).map(([key, value]) => (
                             <div key={key} className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b">
                                <dt className="text-sm font-medium text-gray-500">{key}</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="mt-8 text-center">
                    <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Ubah Password
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnggotaProfil;
