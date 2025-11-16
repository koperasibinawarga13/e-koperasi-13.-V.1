import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Pengumuman } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../../components/icons/Icons';
import Modal from '../../components/Modal';
import { getPengumuman, addPengumuman, updatePengumuman, deletePengumuman } from '../../services/pengumumanService';
import { useAuth } from '../../context/AuthContext';
import RichTextEditor from '../../components/RichTextEditor';

const AdminPengumuman: React.FC = () => {
    const { user } = useAuth();
    const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPengumuman, setSelectedPengumuman] = useState<Pengumuman | null>(null);
    const [formData, setFormData] = useState({ judul: '', isi: '' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPengumuman = async () => {
            setIsLoading(true);
            const data = await getPengumuman();
            setPengumumanList(data);
            setIsLoading(false);
        };
        fetchPengumuman();
    }, []);

    const openModal = (pengumuman: Pengumuman | null = null) => {
        setSelectedPengumuman(pengumuman);
        setFormData({
            judul: pengumuman?.judul || '',
            isi: pengumuman?.isi || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPengumuman(null);
        setFormData({ judul: '', isi: '' });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.judul || !formData.isi) {
            alert('Judul dan Isi tidak boleh kosong.');
            return;
        };

        const dataToSave = {
            ...formData,
            tanggal: new Date().toISOString(),
            penulis: user.name,
        };

        if (selectedPengumuman) {
            // Update
            const updatedData = { ...selectedPengumuman, ...dataToSave };
            const result = await updatePengumuman(updatedData);
            setPengumumanList(pengumumanList.map(p => p.id === result.id ? result : p));
        } else {
            // Add
            const result = await addPengumuman(dataToSave);
            setPengumumanList([result, ...pengumumanList]);
        }
        closeModal();
    };
    
    const handleDelete = async (id: string) => {
        if(window.confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
            await deletePengumuman(id);
            setPengumumanList(pengumumanList.filter(p => p.id !== id));
        }
    };

    return (
        <div>
            <Header title="Kelola Pengumuman & Berita Produk" />
            <div className="bg-surface p-6 rounded-xl border border-gray-700">
                <div className="flex justify-end mb-6">
                    <button onClick={() => openModal()} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        Buat Konten Baru
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? <p className="text-gray-400">Memuat data pengumuman...</p> : (
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-400 uppercase">
                                <tr>
                                    <th className="px-6 py-3 border-b-2 border-gray-700">Judul</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-700">Tanggal Terbit</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-700">Penulis</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-700">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {pengumumanList.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-dark">{item.judul}</td>
                                        <td className="px-6 py-4">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4">{item.penulis}</td>
                                        <td className="px-6 py-4 flex gap-4">
                                            <button onClick={() => openModal(item)} className="text-blue-400 hover:text-blue-300"><PencilIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedPengumuman ? 'Edit Konten' : 'Buat Konten Baru'}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="judul" className="block text-sm font-medium text-gray-300">Judul</label>
                        <input
                            id="judul"
                            type="text"
                            value={formData.judul}
                            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                            required
                            className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-dark"
                        />
                    </div>
                    <div>
                        <label htmlFor="isi" className="block text-sm font-medium text-gray-300">Isi Konten</label>
                        <RichTextEditor
                            value={formData.isi}
                            onChange={(html) => setFormData({ ...formData, isi: html })}
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                         <button type="button" onClick={closeModal} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-500">
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

export default AdminPengumuman;