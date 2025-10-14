// FIX: Implemented full content for types.ts to define shared interfaces and enums.
export enum UserRole {
  ADMIN = 'admin',
  ANGGOTA = 'anggota',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  anggotaId?: string; // To link session with Anggota document
}

export interface Anggota {
  id: string;
  no_anggota: string;
  password?: string; // Added for login
  nama: string;
  nik: string;
  alamat: string;
  no_telepon: string;
  email: string;
  tanggal_bergabung: string;
  status: 'Aktif' | 'Tidak Aktif';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'Simpanan' | 'Penarikan' | 'Pinjaman' | 'Angsuran';
  amount: number;
  balance: number;
}
