
export enum UserRole {
  ADMIN = 'admin',
  ANGGOTA = 'anggota',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface Member {
  id: string;
  memberId: string;
  name: string;
  joinDate: string;
  status: 'Aktif' | 'Tidak Aktif';
  totalSimpanan: number;
  totalPinjaman: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'Simpanan' | 'Penarikan' | 'Pinjaman' | 'Angsuran';
  amount: number;
  balance: number;
}
