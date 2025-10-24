import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { AdminUser } from '../../types';
import { getAdmins, addAdmin, updateAdmin, deleteAdmin } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { PlusIcon, PencilIcon, TrashIcon } from '../../components/icons/Icons';

const AdminPengaturan: React.FC = () => {
    const { user } = useAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [formData, setFormData] = useState({ nama: '', email: '', password: '' });

    useEffect(() => {
        const fetchAdmins = async () => {
            setIsLoading(true);
            const data = await getAdmins();
            setAdmins(data);
            setIsLoading(false);
        };
        fetchAdmins();
    }, []);

    const openModal = (admin: AdminUser | null = null) => {
        setSelectedAdmin(admin);
        setFormData({
            nama: admin?.nama || '',
            email: admin?.email || '',
            password: '', // Always clear password for security
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAdmin(null);
        setFormData({ nama: '', email: '', password: '' });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedAdmin) {
            // Update
            const dataToUpdate: AdminUser = { ...selectedAdmin, nama: formData.nama, email: formData.email };
            if (formData.password) {
                dataToUpdate.password = formData.password;
            }
            const result = await updateAdmin(dataToUpdate);
            setAdmins(admins.map(a => a.id === result.id ? result : a));
        } else {
            // Add
             if (!formData.password) {
                alert('Password wajib diisi untuk admin baru.');
                return;
            }
            const dataToAdd: Omit<AdminUser, 'id'> = {
                nama: formData.nama,
                email: formData.email,
                password: formData.password,
                role: 'admin',
            };
            const result = await addAdmin(dataToAdd);
            setAdmins([...admins, result]);
        }
        closeModal();
    };
    
    const handleDelete = async (id: string) => {
        if(window.confirm('Apakah Anda yakin ingin menghapus akun admin ini?')) {
            // Prevent deleting own account
            if (user?.id === id) {
                alert('Anda tidak dapat menghapus akun Anda sendiri.');
                return;
            }
            await deleteAdmin(id);
            setAdmins(admins.filter(a => a.id !== id));
        }
    };

    return (
        <div>
            <Header title="Pengaturan Akun Admin" />
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-end mb-6">
                    <button onClick={() => openModal()} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        Tambah Admin
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <p>Memuat data admin...</p> : (
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Nama</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin) => (
                                    <tr key={admin.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{admin.nama}</td>
                                        <td className="px-6 py-4">{admin.email}</td>
                                        <td className="px-6 py-4 flex gap-4">
                                            <button onClick={() => openModal(admin)} className="text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5"/></button>
                                            <button 
                                                onClick={() => handleDelete(admin.id)} 
                                                className="text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                                                disabled={user?.id === admin.id}
                                                title={user?.id === admin.id ? 'Tidak dapat menghapus diri sendiri' : 'Hapus Admin'}
                                            >
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedAdmin ? 'Edit Admin' : 'Tambah Admin Baru'}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="nama" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input
                            id="nama"
                            type="text"
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        />
                    </div>
                     <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!selectedAdmin} // Required only for new admin
                            placeholder={selectedAdmin ? 'Isi untuk mengubah password' : 'Wajib diisi'}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                         <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">
                            Batal
                        </button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark">
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminPengaturan;
