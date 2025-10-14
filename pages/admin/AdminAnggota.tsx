// FIX: Implement the AdminAnggota component to display and manage members.
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import AnggotaForm from '../../components/AnggotaForm';
import { Anggota } from '../../types';
import { getAnggota, addAnggota, updateAnggota, deleteAnggota } from '../../services/anggotaService';

const AdminAnggota: React.FC = () => {
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getAnggota();
      setAnggota(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleOpenModal = (anggota?: Anggota) => {
    setSelectedAnggota(anggota || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnggota(null);
  };

  const handleSave = async (data: Omit<Anggota, 'id'> | Anggota) => {
    if ('id' in data) {
      const updated = await updateAnggota(data);
      setAnggota(anggota.map(a => a.id === updated.id ? updated : a));
    } else {
      const newAnggota = await addAnggota(data);
      setAnggota([...anggota, newAnggota]);
    }
    handleCloseModal();
  };
  
  const handleDelete = async (id: string) => {
    if(window.confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
        await deleteAnggota(id);
        setAnggota(anggota.filter(a => a.id !== id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };


  return (
    <div>
      <Header title="Data Anggota" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-dark">Daftar Anggota Koperasi</h2>
          <button
            onClick={() => handleOpenModal()}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Tambah Anggota
          </button>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="text-center p-4">Memuat data anggota...</p>
          ) : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Nama</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Tanggal Bergabung</th>
                  <th scope="col" className="px-6 py-3 text-right">Total Simpanan</th>
                  <th scope="col" className="px-6 py-3 text-right">Total Pinjaman</th>
                  <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {anggota.map((member) => (
                  <tr key={member.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{member.name}</td>
                    <td className="px-6 py-4">{member.email}</td>
                    <td className="px-6 py-4">{member.joinDate}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(member.totalSimpanan)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(member.totalPinjaman)}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleOpenModal(member)} className="font-medium text-blue-600 hover:underline mr-4">Edit</button>
                      <button onClick={() => handleDelete(member.id)} className="font-medium text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedAnggota ? 'Edit Anggota' : 'Tambah Anggota'}>
        <AnggotaForm onSubmit={handleSave} onCancel={handleCloseModal} initialData={selectedAnggota} />
      </Modal>
    </div>
  );
};

export default AdminAnggota;
