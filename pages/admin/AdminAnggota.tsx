import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Anggota } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon, SwitchHorizontalIcon } from '../../components/icons/Icons';
import Modal from '../../components/Modal';
import AnggotaForm from '../../components/AnggotaForm';
import { getAnggota, addAnggota, updateAnggota, deleteAnggota, migrateAnggotaStatus } from '../../services/anggotaService';

const STATUS_PREFIXES = ['AK', 'PB', 'WL', 'TT'];

const AdminAnggota: React.FC = () => {
    const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    // State for status change modal
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedAnggotaForStatusChange, setSelectedAnggotaForStatusChange] = useState<Anggota | null>(null);
    const [confirmationInput, setConfirmationInput] = useState('');
    const [isMigrating, setIsMigrating] = useState(false);
    const [newStatusPrefix, setNewStatusPrefix] = useState<string>('');


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
    
     const handleStatusChangeClick = (anggota: Anggota) => {
        setSelectedAnggotaForStatusChange(anggota);
        const oldPrefix = anggota.no_anggota.split('-')[0];
        const newPrefixOptions = STATUS_PREFIXES.filter(p => p !== oldPrefix);
        if (newPrefixOptions.length > 0) {
            setNewStatusPrefix(newPrefixOptions[0]);
        } else {
            setNewStatusPrefix('');
        }
        setIsStatusModalOpen(true);
    };

    const handleConfirmStatusChange = async () => {
        if (!selectedAnggotaForStatusChange || !newStatusPrefix) return;

        const oldNoAnggota = selectedAnggotaForStatusChange.no_anggota;
        const oldPrefix = oldNoAnggota.split('-')[0];
        const numberPart = oldNoAnggota.substring(oldPrefix.length + 1);
        const newNoAnggota = `${newStatusPrefix}-${numberPart}`;


        if (confirmationInput !== newNoAnggota) {
            alert("Kode konfirmasi tidak sesuai. Mohon ketik kode baru dengan benar.");
            return;
        }

        setIsMigrating(true);
        try {
            await migrateAnggotaStatus(selectedAnggotaForStatusChange, newNoAnggota);
            setAnggotaList(prev => prev.map(a => a.id === selectedAnggotaForStatusChange.id ? {...a, no_anggota: newNoAnggota} : a));
            handleCloseStatusModal();
            alert("Status anggota berhasil diubah dan semua data terkait telah dimigrasikan.");
        } catch(error: any) {
            alert(error.message);
        } finally {
            setIsMigrating(false);
        }
    };

    const handleCloseStatusModal = () => {
        setIsStatusModalOpen(false);
        setSelectedAnggotaForStatusChange(null);
        setConfirmationInput('');
        setNewStatusPrefix('');
    };
    
    const filteredAnggota = useMemo(() => 
        anggotaList.filter(a =>
            a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.no_anggota.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.no_telepon && a.no_telepon.toLowerCase().includes(searchTerm.toLowerCase()))
        ),
        [anggotaList, searchTerm]
    );
    
    const renderStatusChangeModal = () => {
        if (!selectedAnggotaForStatusChange) return null;

        const oldNoAnggota = selectedAnggotaForStatusChange.no_anggota;
        const oldPrefix = oldNoAnggota.split('-')[0];
        const numberPart = oldNoAnggota.substring(oldPrefix.length + 1);
        const newNoAnggota = newStatusPrefix ? `${newStatusPrefix}-${numberPart}` : '';
        
        const statusOptions = STATUS_PREFIXES.filter(p => p !== oldPrefix);

        const getPrefixDescription = (prefix: string) => {
            switch (prefix) {
                case 'AK': return 'AK - Pegawai Aktif';
                case 'PB': return 'PB - Purna Bakti';
                case 'WL': return 'WL - Warga Luar';
                case 'TT': return 'TT - Titipan';
                default: return prefix;
            }
        };

        return (
          <Modal isOpen={isStatusModalOpen} onClose={handleCloseStatusModal} title="Konfirmasi Perubahan Status">
            <div>
              <p className="mb-4">Anda akan mengubah status kepegawaian untuk anggota:</p>
              <p className="font-bold text-lg mb-4 text-center">{selectedAnggotaForStatusChange.nama}</p>
              <div className="flex justify-around items-center my-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Kode Lama</p>
                  <p className="font-bold text-red-600 text-xl">{oldNoAnggota}</p>
                </div>
                <p className="text-2xl font-bold">&rarr;</p>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Kode Baru</p>
                  <p className="font-bold text-green-600 text-xl">{newNoAnggota || 'Pilih status...'}</p>
                </div>
              </div>

               <div className="mt-4">
                <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700">
                  Pilih Status Kepegawaian Baru:
                </label>
                <select
                  id="newStatus"
                  value={newStatusPrefix}
                  onChange={(e) => setNewStatusPrefix(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-surface"
                >
                  {statusOptions.map(prefix => (
                    <option key={prefix} value={prefix}>{getPrefixDescription(prefix)}</option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mt-4">
                <strong>Peringatan:</strong> Tindakan ini akan memigrasikan semua data terkait (keuangan, riwayat transaksi, dan pinjaman) ke kode anggota yang baru. Proses ini tidak dapat dibatalkan.
              </div>
              <div className="mt-6">
                <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700">
                  Ketik kode baru (<span className="font-bold">{newNoAnggota}</span>) untuk konfirmasi:
                </label>
                <input
                  type="text"
                  id="confirmation"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={handleCloseStatusModal}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  disabled={isMigrating || confirmationInput !== newNoAnggota || !newNoAnggota}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-400"
                >
                  {isMigrating ? 'Memigrasikan...' : 'Konfirmasi & Ubah Status'}
                </button>
              </div>
            </div>
          </Modal>
        );
    };

  return (
    <div>
      <Header title="Data Anggota" />
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <input
                type="text"
                placeholder="Cari anggota (nama, no. anggota, No. HP)..."
                className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/3 focus:ring-1 focus:ring-primary focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center gap-2">
                <button onClick={handleAdd} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-all transform hover:scale-105 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    Tambah Anggota
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <p>Loading data anggota...</p> : (
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-500 uppercase">
                    <tr>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200">No. Anggota</th>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200">Nama</th>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200">No. HP</th>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200">Status</th>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold border-b-2 border-gray-200">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredAnggota.map((anggota) => (
                        <tr key={anggota.id} className="hover:bg-primary-light transition-colors">
                            <td className="px-4 py-4 sm:px-6 font-medium text-dark">{anggota.no_anggota}</td>
                            <td className="px-4 py-4 sm:px-6">{anggota.nama}</td>
                            <td className="px-4 py-4 sm:px-6">{anggota.no_telepon}</td>
                            <td className="px-4 py-4 sm:px-6">
                                {(() => {
                                    if (anggota.status === 'Tidak Aktif') {
                                        return (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                Tidak Aktif
                                            </span>
                                        );
                                    }

                                    const hasRegistered = anggota.password && anggota.password.length > 0;

                                    if (hasRegistered) {
                                        return (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-secondary-light text-secondary-dark">
                                                Aktif
                                            </span>
                                        );
                                    } else {
                                        return (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                                                Belum Registrasi
                                            </span>
                                        );
                                    }
                                })()}
                            </td>
                            <td className="px-4 py-4 sm:px-6 flex gap-3">
                                <button onClick={() => handleEdit(anggota)} className="text-blue-600 hover:text-blue-800" title="Edit Anggota"><PencilIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleStatusChangeClick(anggota)} className="text-gray-600 hover:text-gray-800" title="Ubah Status Kepegawaian"><SwitchHorizontalIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDelete(anggota.id)} className="text-red-600 hover:text-red-800" title="Hapus Anggota"><TrashIcon className="w-5 h-5"/></button>
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
      {renderStatusChangeModal()}
    </div>
  );
};

export default AdminAnggota;