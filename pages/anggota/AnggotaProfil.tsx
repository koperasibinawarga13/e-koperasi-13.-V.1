import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon } from '../../components/icons/Icons';
import { Anggota } from '../../types';
import { getAnggotaById, updateAnggota } from '../../services/anggotaService';

// Moved EditableField outside the AnggotaProfil component to prevent re-mounting on every render.
const EditableField: React.FC<{
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    type?: string;
    isTextarea?: boolean;
    fullWidth?: boolean;
}> = ({ label, name, value, onChange, type = 'text', isTextarea = false, fullWidth = false }) => (
    <div className={`py-2 ${fullWidth ? 'sm:col-span-2' : 'sm:col-span-1'}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        {isTextarea ? (
            <textarea id={name} name={name} value={value} onChange={onChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
        ) : (
            <input type={type} id={name} name={name} value={value} onChange={onChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
        )}
    </div>
);

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
                      email: data.email || '',
                      no_telepon: data.no_telepon || '',
                      alamat: data.alamat || '',
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

  const ProfileInfoRow: React.FC<{ label: string; value: string | undefined | null; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={`py-3 sm:grid sm:grid-cols-3 sm:gap-4 ${fullWidth ? 'sm:col-span-2' : ''}`}>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-md text-dark sm:mt-0 sm:col-span-2">{value || '-'}</dd>
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
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 border-b pb-6 mb-6">
          <UserCircleIcon className="w-24 h-24 text-gray-300 flex-shrink-0" />
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-dark">{profileData.nama}</h2>
            <p className="text-gray-500">No. Anggota: {profileData.no_anggota}</p>
          </div>
        </div>
        
        {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <EditableField label="Email" name="email" value={editableData.email} onChange={handleInputChange} type="email" />
                <EditableField label="No. Telepon" name="no_telepon" value={editableData.no_telepon} onChange={handleInputChange} type="tel" />
                <EditableField label="Alamat" name="alamat" value={editableData.alamat} onChange={handleInputChange} isTextarea={true} fullWidth={true} />
            </div>
        ) : (
            <dl className="divide-y divide-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2">
                    <ProfileInfoRow label="NIK" value={profileData.nik} />
                    <ProfileInfoRow label="Tanggal Bergabung" value={profileData.tanggal_bergabung ? new Date(profileData.tanggal_bergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
                    <ProfileInfoRow label="Email" value={profileData.email} />
                    <ProfileInfoRow label="No. Telepon" value={profileData.no_telepon} />
                </div>
                <ProfileInfoRow label="Alamat" value={profileData.alamat} fullWidth={true}/>
            </dl>
        )}
        
        <div className="mt-8 flex justify-end gap-4">
            {isEditing ? (
                <>
                    <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Batal</button>
                    <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors">Simpan Perubahan</button>
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
