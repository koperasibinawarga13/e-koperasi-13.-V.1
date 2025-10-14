import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon } from '../../components/icons/Icons';
import { Anggota } from '../../types';
import { getAnggotaById, updateAnggota } from '../../services/anggotaService';

const AnggotaProfil: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Anggota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editableData, setEditableData] = useState({
      email: '',
      no_telepon: '',
      alamat: '',
  });

  useEffect(() => {
      const fetchProfile = async () => {
          if (user?.anggotaId) {
              setIsLoading(true);
              const data = await getAnggotaById(user.anggotaId);
              setProfileData(data);
              if (data) {
                  setEditableData({
                      email: data.email,
                      no_telepon: data.no_telepon,
                      alamat: data.alamat,
                  });
              }
              setIsLoading(false);
          }
      };
      fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setEditableData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
      if (profileData) {
          const updatedData = { ...profileData, ...editableData };
          const result = await updateAnggota(updatedData);
          setProfileData(result);
          setIsEditing(false);
      }
  };

  const ProfileField: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500">{label}</label>
        <p className="mt-1 text-md text-dark">{value}</p>
    </div>
  );
  
  const EditableField: React.FC<{label: string, name: keyof typeof editableData, value: string, type?: string, isTextarea?: boolean}> = ({label, name, value, type='text', isTextarea=false}) => (
      <div>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
          {isTextarea ? (
              <textarea id={name} name={name} value={value} onChange={handleInputChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          ) : (
              <input type={type} id={name} name={name} value={value} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          )}
      </div>
  );

  if (isLoading) {
      return <div>Loading profile...</div>;
  }

  if (!profileData) {
      return <div>Gagal memuat profil.</div>;
  }

  return (
    <div>
      <Header title="Profil Anggota" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center space-x-6 border-b pb-6 mb-6">
          <UserCircleIcon className="w-24 h-24 text-gray-300" />
          <div>
            <h2 className="text-2xl font-bold text-dark">{profileData.nama}</h2>
            <p className="text-gray-500">No. Anggota: {profileData.no_anggota}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ProfileField label="NIK" value={profileData.nik} />
            <ProfileField label="Tanggal Bergabung" value={new Date(profileData.tanggal_bergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />

            {isEditing ? (
                <>
                    <EditableField label="Email" name="email" value={editableData.email} type="email" />
                    <EditableField label="No. Telepon" name="no_telepon" value={editableData.no_telepon} type="tel" />
                    <EditableField label="Alamat" name="alamat" value={editableData.alamat} isTextarea={true} />
                </>
            ) : (
                <>
                    <ProfileField label="Email" value={profileData.email} />
                    <ProfileField label="No. Telepon" value={profileData.no_telepon} />
                    <ProfileField label="Alamat" value={profileData.alamat} />
                </>
            )}
        </div>
        
        <div className="mt-8 flex justify-end gap-4">
            {isEditing ? (
                <>
                    <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Batal</button>
                    <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors">Simpan Perubahan</button>
                </>
            ) : (
                <button onClick={() => setIsEditing(true)} className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors">Ubah Profil</button>
            )}
        </div>
      </div>
    </div>
  );
};

export default AnggotaProfil;
