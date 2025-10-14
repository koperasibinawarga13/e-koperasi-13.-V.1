export enum UserRole {
  ADMIN = 'admin',
  ANGGOTA = 'anggota',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  anggotaId?: string; // Link to Anggota document if role is ANGGOTA
}

export interface Anggota {
  id: string;
  nomorAnggota: string;
  nama: string;
  nik: string;
  alamat: string;
  telepon: string;
  tanggalMasuk: string; // ISO string date
  status: 'Aktif' | 'Tidak Aktif';
}

export interface Transaction {
    id: string;
    date: string; // ISO string date
    description: string;
    type: 'Simpanan' | 'Penarikan' | 'Pinjaman' | 'Angsuran';
    amount: number;
    balance: number;
}
