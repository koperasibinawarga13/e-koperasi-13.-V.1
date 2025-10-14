
import React from 'react';
import Header from '../../components/Header';
import { Member } from '../../types';

const mockMembers: Member[] = [
  { id: '1', memberId: 'B-001', name: 'Budi Santoso', joinDate: '2022-01-15', status: 'Aktif', totalSimpanan: 15000000, totalPinjaman: 5000000 },
  { id: '2', memberId: 'A-002', name: 'Ani Yudhoyono', joinDate: '2021-11-20', status: 'Aktif', totalSimpanan: 25000000, totalPinjaman: 0 },
  { id: '3', memberId: 'C-003', name: 'Citra Lestari', joinDate: '2023-03-10', status: 'Aktif', totalSimpanan: 5000000, totalPinjaman: 2000000 },
  { id: '4', memberId: 'D-004', name: 'Dewi Persik', joinDate: '2020-05-01', status: 'Tidak Aktif', totalSimpanan: 10000000, totalPinjaman: 10000000 },
];

const AdminAnggota: React.FC = () => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div>
      <Header title="Data Anggota" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-dark">Daftar Anggota</h2>
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            + Tambah Anggota
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">ID Anggota</th>
                <th scope="col" className="px-6 py-3">Nama</th>
                <th scope="col" className="px-6 py-3">Tanggal Bergabung</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Simpanan</th>
                <th scope="col" className="px-6 py-3 text-right">Pinjaman</th>
                <th scope="col" className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {mockMembers.map((member) => (
                <tr key={member.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{member.memberId}</td>
                  <td className="px-6 py-4">{member.name}</td>
                  <td className="px-6 py-4">{member.joinDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">{formatCurrency(member.totalSimpanan)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(member.totalPinjaman)}</td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button className="font-medium text-blue-600 hover:underline">Edit</button>
                    <button className="font-medium text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnggota;
