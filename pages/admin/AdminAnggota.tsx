import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { Anggota } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon, SwitchHorizontalIcon } from '../../components/icons/Icons';
import Modal from '../../components/Modal';
import AnggotaForm from '../../components/AnggotaForm';
import { getAnggota, addAnggota, updateAnggota, deleteAnggota, migrateAnggotaStatus, deleteAllAnggota } from '../../services/anggotaService';

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
    
    // State for delete all modal
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [deleteAllConfirmation, setDeleteAllConfirmation] = useState('');
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const CONFIRMATION_TEXT = 'HAPUS SEMUA ANGGOTA';


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

    const openDeleteAllModal = () => {
        setIsDeleteAllModalOpen(true);
    };

    const closeDeleteAllModal = () => {
        setIsDeleteAllModalOpen(false);
        setDeleteAllConfirmation('');
    };

    const handleDeleteAll = async () => {
        if (deleteAllConfirmation !== CONFIRMATION_TEXT) {
            alert("Teks konfirmasi tidak cocok.");
            return;
        }
        setIsDeletingAll(true);
        try {
            await deleteAllAnggota();
            setAnggotaList([]);
            closeDeleteAllModal();
            alert('Semua data anggota berhasil dihapus.');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsDeletingAll(false);
        }
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
              <p className="mb-4 text-dark">Anda akan mengubah status kepegawaian untuk anggota:</p>
              <p className="font-bold text-lg mb-4 text-center text-dark">{selectedAnggotaForStatusChange.nama}</p>
              <div className="flex justify-around items-center my-4">
                <div className="text-center">
                  <p className="text-sm text-gray-text">Kode Lama</p>
                  <p className="font-bold text-red-500 text-xl">{oldNoAnggota}</p>
                </div>
                <p className="text-2xl font-bold text-dark">&rarr;</p>
                <div className="text-center">
                  <p className="text-sm text-gray-text">Kode Baru</p>
                  <p className="font-bold text-green-500 text-xl">{newNoAnggota || 'Pilih status...'}</p>
                </div>
              </div>

               <div className="mt-4">
                <label htmlFor="newStatus" className="block text-sm font-medium text-gray-text">
                  Pilih Status Kepegawaian Baru:
                </label>
                <select
                  id="newStatus"
                  value={newStatusPrefix}
                  onChange={(e) => setNewStatusPrefix(e.target.value)}
                  className="mt-1 block w-full bg-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-dark"
                >
                  {statusOptions.map(prefix => (
                    <option key={prefix} value={prefix}>{getPrefixDescription(prefix)}</option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-100 text-amber-800 p-3 rounded-lg text-sm mt-4">
                <strong>Peringatan:</strong> Tindakan ini akan memigrasikan semua data terkait (keuangan, riwayat transaksi, dan pinjaman) ke kode anggota yang baru. Proses ini tidak dapat dibatalkan.
              </div>
              <div className="mt-6">
                <label htmlFor="confirmation" className="block text-sm font-medium text-gray-text">
                  Ketik kode baru (<span className="font-bold">{newNoAnggota}</span>) untuk konfirmasi:
                </label>
                <input
                  type="text"
                  id="confirmation"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="mt-1 block w-full bg-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-dark"
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={handleCloseStatusModal}
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  disabled={isMigrating || confirmationInput !== newNoAnggota || !newNoAnggota}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-slate-400"
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
      <div className="bg-surface p-6 rounded-xl shadow-md">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <input
                type="text"
                placeholder="Cari anggota (nama, no. anggota, No. HP)..."
                className="bg-slate-100 rounded-lg px-4 py-2 w-full sm:w-1/3 focus:ring-1 focus:ring-primary focus:border-primary text-dark"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center gap-2">
                <button onClick={handleAdd} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-all transform hover:scale-105 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    Tambah Anggota
                </button>
                <button 
                    onClick={openDeleteAllModal} 
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105 flex items-center gap-2">
                    <TrashIcon className="w-5 h-5" />
                    Hapus Semua Anggota
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <p className="text-gray-text">Loading data anggota...</p> : (
            <table className="w-full text-sm text-left text-gray-text">
                <thead className="text-xs text-gray-text uppercase">
                    <tr>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold">No. Anggota</th>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold">Nama</th>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold">No. HP</th>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold">Status</th>
                        <th scope="col" className="px-4 py-4 sm:px-6 font-semibold">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAnggota.map((anggota) => (
                        <tr key={anggota.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 sm:px-6 font-medium text-dark">{anggota.no_anggota}</td>
                            <td className="px-4 py-4 sm:px-6 text-dark">{anggota.nama}</td>
                            <td className="px-4 py-4 sm:px-6">{anggota.no_telepon}</td>
                            <td className="px-4 py-4 sm:px-6">
                                {(() => {
                                    if (anggota.status === 'Tidak Aktif') {
                                        return (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                                                Tidak Aktif
                                            </span>
                                        );
                                    }

                                    const hasRegistered = anggota.password && anggota.password.length > 0;

                                    if (hasRegistered) {
                                        return (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                                Aktif
                                            </span>
                                        );
                                    } else {
                                        return (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                                                Belum Registrasi
                                            </span>
                                        );
                                    }
                                })()}
                            </td>
                            <td className="px-4 py-4 sm:px-6 flex gap-3">
                                <button onClick={() => handleEdit(anggota)} className="text-primary hover:text-primary-dark" title="Edit Anggota"><PencilIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleStatusChangeClick(anggota)} className="text-gray-text hover:text-dark" title="Ubah Status Kepegawaian"><SwitchHorizontalIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDelete(anggota.id)} className="text-red-500 hover:text-red-600" title="Hapus Anggota"><TrashIcon className="w-5 h-5"/></button>
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

      <Modal isOpen={isDeleteAllModalOpen} onClose={closeDeleteAllModal} title="Konfirmasi Hapus Semua Anggota">
        <div>
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                <p className="font-bold">Peringatan Keras!</p>
                <p>Anda akan menghapus <strong>semua data profil anggota</strong> secara permanen.</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Tindakan ini <strong>tidak dapat dibatalkan</strong>.</li>
                    <li>Data keuangan dan riwayat transaksi yang terkait dengan nomor anggota lama <strong>TIDAK akan terhapus</strong>, namun tidak akan bisa diakses melalui profil anggota.</li>
                    <li>Sangat disarankan untuk melakukan backup data terlebih dahulu.</li>
                </ul>
            </div>
            
            <p className="mb-4 text-dark">Untuk melanjutkan, silakan ketik teks berikut di bawah ini:</p>
            <p className="text-center font-bold text-lg my-2 select-all text-dark">{CONFIRMATION_TEXT}</p>

            <input
                type="text"
                value={deleteAllConfirmation}
                onChange={(e) => setDeleteAllConfirmation(e.target.value)}
                className="w-full bg-slate-100 rounded-md shadow-sm p-2 text-dark"
                placeholder="Ketik teks konfirmasi di sini"
            />
            
            <div className="flex justify-end gap-4 mt-6">
                <button
                    onClick={closeDeleteAllModal}
                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                >
                    Batal
                </button>
                <button
                    onClick={handleDeleteAll}
                    disabled={isDeletingAll || deleteAllConfirmation !== CONFIRMATION_TEXT}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isDeletingAll ? 'Menghapus...' : 'Saya Mengerti, Hapus Semua'}
                </button>
            </div>
        </div>
      </Modal>

      {renderStatusChangeModal()}
    </div>
  );
};

export default AdminAnggota;