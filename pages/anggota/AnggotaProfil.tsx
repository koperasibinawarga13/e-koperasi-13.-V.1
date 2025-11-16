import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon } from '../../components/icons/Icons';
import { Anggota } from '../../types';
import { getAnggotaById, updateAnggota, updateAnggotaPassword } from '../../services/anggotaService';

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
        <label htmlFor={name} className="block text-sm font-medium text-gray-text">{label}</label>
        {isTextarea ? (
            <textarea id={name} name={name} value={value} onChange={onChange} rows={3} className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 focus:outline-none focus:ring-primary text-dark" />
        ) : (
            <input type={type} id={name} name={name} value={value} onChange={onChange} className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 focus:outline-none focus:ring-primary text-dark" />
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

  const [passwordData, setPasswordData] = useState({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
      if (profileData) {
          const updatedData = { ...profileData, ...editableData };
          const result = await updateAnggota(updatedData);
          setProfileData(result);
          setIsEditing(false);
      }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' });
        return;
    }
    if (!passwordData.newPassword || !passwordData.oldPassword) {
         setPasswordMessage({ type: 'error', text: 'Semua kolom password wajib diisi.' });
         return;
    }
    if (!user?.anggotaId) return;

    setIsSavingPassword(true);
    try {
        await updateAnggotaPassword(user.anggotaId, passwordData.oldPassword, passwordData.newPassword);
        setPasswordMessage({ type: 'success', text: 'Password berhasil diperbarui.' });
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
        setPasswordMessage({ type: 'error', text: error.message || 'Gagal mengubah password.' });
    } finally {
        setIsSavingPassword(false);
    }
  };

  const ProfileInfoRow: React.FC<{ label: string; value: string | undefined | null; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={`py-3 sm:grid sm:grid-cols-3 sm:gap-4 ${fullWidth ? 'sm:col-span-2' : ''}`}>
        <dt className="text-sm font-medium text-gray-text">{label}</dt>
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
      <div className="bg-surface p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 mb-6">
          <UserCircleIcon className="w-24 h-24 text-zinc-400 flex-shrink-0" />
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-dark">{profileData.nama}</h2>
            <p className="text-gray-text">No. Anggota: {profileData.no_anggota}</p>
          </div>
        </div>
        
        {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <EditableField label="Email" name="email" value={editableData.email} onChange={handleInputChange} type="email" />
                <EditableField label="No. Telepon" name="no_telepon" value={editableData.no_telepon} onChange={handleInputChange} type="tel" />
                <EditableField label="Alamat" name="alamat" value={editableData.alamat} onChange={handleInputChange} isTextarea={true} fullWidth={true} />
            </div>
        ) : (
            <dl>
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
                    <button onClick={() => setIsEditing(false)} className="bg-zinc-700 text-dark px-4 py-2 rounded-lg font-semibold hover:bg-zinc-600 transition-colors">Batal</button>
                    <button onClick={handleSave} className="bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors">Simpan Perubahan</button>
                </>
            ) : (
                <button onClick={() => setIsEditing(true)} className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary-dark transition-colors">Ubah Profil</button>
            )}
        </div>
      </div>

       <div className="bg-surface p-6 rounded-xl mt-8">
        <h3 className="text-lg font-medium text-dark pb-3 mb-4 border-b border-zinc-800">Ubah Password</h3>
        {passwordMessage && (
            <div className={`p-3 rounded-md text-sm mb-4 ${passwordMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {passwordMessage.text}
            </div>
        )}
        <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-text">Password Lama</label>
                <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} required className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 text-dark"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-text">Password Baru</label>
                    <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 text-dark" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-text">Konfirmasi Password Baru</label>
                    <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required className="mt-1 block w-full bg-zinc-800 rounded-md py-2 px-3 text-dark" />
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSavingPassword} className="bg-primary text-black py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-zinc-700">
                    {isSavingPassword ? 'Menyimpan...' : 'Ubah Password'}
                </button>
            </div>
        </form>
       </div>

    </div>
  );
};

export default AnggotaProfil;