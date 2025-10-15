import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Anggota } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon } from '../../components/icons/Icons';
import Modal from '../../components/Modal';
import AnggotaForm from '../../components/AnggotaForm';
import { getAnggota, addAnggota, updateAnggota, deleteAnggota } from '../../services/anggotaService';

const AdminAnggota: React.FC = () => {
    const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnggota = async () => {
            setIsLoading(true);
            const data = await getAnggota();
            setAnggotaList(data);
            setIsLoading(false);
        };
        fetchAnggota();
    }, []);

    const handleAdd = () => {
        setSelectedAnggota(null);
        setIsModalOpen(true);
    };

    const handleEdit = (anggota: Anggota) => {
        setSelectedAnggota(anggota);
        setIsModalOpen(true);
    };
    
    const handleDelete = async (id: string) => {
        if(window.confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
            await deleteAnggota(id);
            setAnggotaList(anggotaList.filter(a => a.id !== id));
        }
    };

    const handleSave = async (anggotaData: Anggota) => {
        if (selectedAnggota) {
            // Update
            const updatedAnggota = await updateAnggota(anggotaData);
            setAnggotaList(anggotaList.map(a => a.id === updatedAnggota.id ? updatedAnggota : a));
        } else {
            // Add
            const { id, ...newAnggotaData } = anggotaData; // remove the temporary id
            const newAnggota = await addAnggota(newAnggotaData);
            setAnggotaList([...anggotaList, newAnggota]);
        }
        setIsModalOpen(false);
        setSelectedAnggota(null);
    };
    
    const filteredAnggota = useMemo(() => 
        anggotaList.filter(a =>
            a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.no_anggota.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.no_telepon && a.no_telepon.toLowerCase().includes(searchTerm.toLowerCase()))
        ),
        [anggotaList, searchTerm]
    );

  return (
    <div>
      <Header title="Data Anggota" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <input
                type="text"
                placeholder="Cari anggota (nama, no. anggota, No. HP)..."
                className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => navigate('/admin/upload')} 
                    className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                    <UploadIcon className="w-5 h-5" />
                    Upload Excel
                </button>
                <button onClick={handleAdd} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    Tambah Anggota
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <p>Loading data anggota...</p> : (
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">No. Anggota</th>
                        <th scope="col" className="px-6 py-3">Nama</th>
                        <th scope="col" className="px-6 py-3">No. HP</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAnggota.map((anggota) => (
                        <tr key={anggota.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{anggota.no_anggota}</td>
                            <td className="px-6 py-4">{anggota.nama}</td>
                            <td className="px-6 py-4">{anggota.no_telepon}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${anggota.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {anggota.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                                <button onClick={() => handleEdit(anggota)} className="text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDelete(anggota.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5"/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedAnggota ? 'Edit Anggota' : 'Tambah Anggota'}>
        <AnggotaForm onSave={handleSave} initialData={selectedAnggota} />
      </Modal>
    </div>
  );
};

export default AdminAnggota;