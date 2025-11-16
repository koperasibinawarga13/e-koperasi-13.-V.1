import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { AdminUser } from '../../types';
import { getAdminById, updateAdmin } from '../../services/adminService';

const AdminProfil: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<AdminUser | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        no_telepon: '',
        alamat: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user?.id) {
                setIsLoading(true);
                const data = await getAdminById(user.id);
                setProfile(data);
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        email: data.email || '',
                        no_telepon: data.no_telepon || '',
                        alamat: data.alamat || '',
                    }));
                }
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Password dan konfirmasi password tidak cocok.' });
            return;
        }
        if (!profile) return;

        setIsSaving(true);
        try {
            const dataToUpdate: AdminUser = {
                ...profile,
                email: formData.email,
                no_telepon: formData.no_telepon,
                alamat: formData.alamat,
            };

            if (formData.password) {
                dataToUpdate.password = formData.password;
            }

            const updatedProfile = await updateAdmin(dataToUpdate);
            setProfile(updatedProfile);
            setFormData(prev => ({...prev, password: '', confirmPassword: ''})); // Clear password fields
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });

        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal memperbarui profil. Silakan coba lagi.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const FormField: React.FC<{
        label: string;
        name: keyof typeof formData;
        value: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
        type?: string;
        isTextarea?: boolean;
        placeholder?: string;
        disabled?: boolean;
    }> = ({ label, name, value, onChange, type = 'text', isTextarea = false, placeholder, disabled = false }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-text">{label}</label>
            {isTextarea ? (
                <textarea 
                    id={name} name={name} value={value} onChange={onChange} 
                    rows={3} disabled={disabled}
                    className="mt-1 block w-full bg-slate-100 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary disabled:bg-slate-200 text-dark" 
                />
            ) : (
                <input 
                    type={type} id={name} name={name} value={value} onChange={onChange} 
                    placeholder={placeholder} disabled={disabled}
                    className="mt-1 block w-full bg-slate-100 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary disabled:bg-slate-200 disabled:cursor-not-allowed text-dark" 
                />
            )}
        </div>
    );


    if (isLoading) {
        return (
            <div>
                <Header title="Profil Admin" />
                <p className="text-center p-10 text-gray-text">Memuat profil...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div>
                <Header title="Profil Admin" />
                <p className="text-center p-10 text-red-500">Gagal memuat profil admin.</p>
            </div>
        );
    }

    return (
        <div>
            <Header title="Profil Admin" />
            <div className="bg-surface p-6 rounded-xl shadow-md max-w-2xl mx-auto">
                <form onSubmit={handleSave} className="space-y-6">
                    <h3 className="text-lg font-medium text-dark pb-3">Informasi Akun</h3>
                    
                    {message && (
                        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-gray-text">Nama Lengkap (Tidak dapat diubah)</label>
                            <input 
                                type="text"
                                value={profile.nama}
                                disabled
                                className="mt-1 block w-full bg-slate-200 rounded-md py-2 px-3 cursor-not-allowed text-gray-text" 
                                title="Nama tidak dapat diubah untuk menjaga integritas data transaksi."
                            />
                         </div>
                        <FormField label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
                    </div>
                    
                    <h3 className="text-lg font-medium text-dark pb-3 pt-4">Ubah Password</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Password Baru" name="password" value={formData.password} onChange={handleChange} type="password" placeholder="Isi untuk mengubah" />
                        <FormField label="Konfirmasi Password Baru" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password" placeholder="Ketik ulang password baru" />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="bg-primary text-white py-2 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-slate-400"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminProfil;