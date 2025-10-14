export enum UserRole {
  ADMIN = 'admin',
  ANGGOTA = 'anggota',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

export interface Anggota {
    id: string;
    no_anggota: string;
    nama: string;
    nik: string;
    alamat: string;
    no_telepon: string;
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
