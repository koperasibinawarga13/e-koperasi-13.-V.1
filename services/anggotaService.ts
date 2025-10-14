// FIX: Implement a mock service for managing 'Anggota' data.
import { Anggota } from '../types';

// Mock data
let mockAnggota: Anggota[] = [
  { id: '1', name: 'Budi Santoso', email: 'budi.s@mail.com', joinDate: '2022-01-15', phone: '081234567890', address: 'Jl. Merdeka No. 17, Jakarta', totalSimpanan: 15000000, totalPinjaman: 5000000 },
  { id: '2', name: 'Ani Yudhoyono', email: 'ani.y@mail.com', joinDate: '2022-02-20', phone: '081234567891', address: 'Jl. Pahlawan No. 1, Surabaya', totalSimpanan: 25000000, totalPinjaman: 0 },
  { id: '3', name: 'Cahyo Kumolo', email: 'cahyo.k@mail.com', joinDate: '2022-03-10', phone: '081234567892', address: 'Jl. Diponegoro No. 8, Bandung', totalSimpanan: 10000000, totalPinjaman: 10000000 },
];

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getAnggota = async (): Promise<Anggota[]> => {
  await simulateDelay(500);
  return [...mockAnggota];
};

export const addAnggota = async (anggotaData: Omit<Anggota, 'id'>): Promise<Anggota> => {
    await simulateDelay(500);
    const newAnggota: Anggota = {
        id: (mockAnggota.length + 1 + Math.random()).toString(),
        ...anggotaData,
    };
    mockAnggota.push(newAnggota);
    return newAnggota;
};

export const updateAnggota = async (anggotaData: Anggota): Promise<Anggota> => {
    await simulateDelay(500);
    mockAnggota = mockAnggota.map(a => a.id === anggotaData.id ? anggotaData : a);
    return anggotaData;
};

export const deleteAnggota = async (id: string): Promise<void> => {
    await simulateDelay(500);
    mockAnggota = mockAnggota.filter(a => a.id !== id);
};
