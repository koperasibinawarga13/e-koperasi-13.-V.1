import { Anggota } from '../types';

// Mock data to simulate Firestore
let mockAnggota: Anggota[] = [
  { id: '1', nomorAnggota: 'AGT001', nama: 'Budi Santoso', nik: '3201234567890001', alamat: 'Jl. Merdeka No. 1', telepon: '081234567890', tanggalMasuk: '2022-01-15', status: 'Aktif' },
  { id: '2', nomorAnggota: 'AGT002', nama: 'Siti Aminah', nik: '3201234567890002', alamat: 'Jl. Pahlawan No. 2', telepon: '081234567891', tanggalMasuk: '2022-02-20', status: 'Aktif' },
  { id: '3', nomorAnggota: 'AGT003', nama: 'Joko Widodo', nik: '3201234567890003', alamat: 'Jl. Kenanga No. 3', telepon: '081234567892', tanggalMasuk: '2023-03-10', status: 'Tidak Aktif' },
];

let nextId = 4;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getAnggota = async (): Promise<Anggota[]> => {
  await delay(500); // Simulate network delay
  return [...mockAnggota];
};

export const addAnggota = async (anggotaData: Omit<Anggota, 'id'>): Promise<Anggota> => {
  await delay(500);
  const newAnggota: Anggota = {
    ...anggotaData,
    id: (nextId++).toString(),
  };
  mockAnggota.push(newAnggota);
  return newAnggota;
};

export const updateAnggota = async (id: string, anggotaData: Partial<Anggota>): Promise<Anggota> => {
    await delay(500);
    const index = mockAnggota.findIndex(a => a.id === id);
    if (index === -1) {
        throw new Error('Anggota not found');
    }
    mockAnggota[index] = { ...mockAnggota[index], ...anggotaData };
    return mockAnggota[index];
};

export const deleteAnggota = async (id: string): Promise<void> => {
    await delay(500);
    mockAnggota = mockAnggota.filter(a => a.id !== id);
};
