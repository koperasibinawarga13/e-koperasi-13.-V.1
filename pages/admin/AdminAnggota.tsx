import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Anggota } from '../../types';
import { getAnggota, addAnggota, updateAnggota, deleteAnggota } from '../../services/anggotaService';
import { PlusIcon, PencilIcon, TrashIcon } from '../../components/icons/Icons';
import Modal from '../../components/Modal';
import AnggotaForm from '../../components/AnggotaForm';

const AdminAnggota: React.FC = () => {
    const [anggota, setAnggota] = useState<Anggota[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnggota, setEditingAnggota] = useState<Anggota | null>(null);

    useEffect(() => {
        fetchAnggota();
    }, []);

    const fetchAnggota = async () => {
        setLoading(true);
        try {
            const data = await getAnggota();
            setAnggota(data);
        } catch (error) {
            console.error("Error fetching anggota:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (data?: Anggota) => {
        setEditingAnggota(data || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAnggota(null);
    };

    const handleSubmit = async (data: Omit<Anggota, 'id'> | Anggota) => {
        try {
            if ('id' in data) {
                // Editing existing anggota
                await updateAnggota(data.id, data);
            } else {
                // Adding new anggota
                await addAnggota(data);
            }
            fetchAnggota(); // Refresh data
        } catch (error) {
            console.error("Error saving anggota:", error);
        } finally {
            handleCloseModal();
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
            try {
                await deleteAnggota(id);
                fetchAnggota(); // Refresh data
            } catch (error) {
                console.error("Error deleting anggota:", error);
            }
        }
    };

    return (
        <div>
            <Header title="Data Anggota" />
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-dark">Daftar Anggota</h2>
                    <button onClick={() => handleOpenModal()} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        Tambah Anggota
                    </button>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">No. Anggota</th>
                                    <th scope="col" className="px-6 py-3">Nama</th>
                                    <th scope="col" className="px-6 py-3">NIK</th>
                                    <th scope="col" className="px-6 py-3">Telepon</th>
                                    <th scope="col" className="px-6 py-3">Tgl Masuk</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {anggota.map((item) => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{item.nomorAnggota}</td>
                                        <td className="px-6 py-4">{item.nama}</td>
                                        <td className="px-6 py-4">{item.nik}</td>
                                        <td className="px-6 py-4">{item.telepon}</td>
                                        <td className="px-6 py-4">{item.tanggalMasuk}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex justify-center gap-2">
                                            <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingAnggota ? 'Edit Anggota' : 'Tambah Anggota Baru'}>
                <AnggotaForm onSubmit={handleSubmit} onCancel={handleCloseModal} initialData={editingAnggota} />
            </Modal>
        </div>
    );
};

export default AdminAnggota;
