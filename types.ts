// FIX: Create type definitions for User, Anggota, and Transaction.
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

export type TransactionType = 'Simpanan' | 'Angsuran' | 'Penarikan' | 'Pinjaman';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  balance: number;
}

export interface Anggota {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  phone: string;
  address: string;
  totalSimpanan: number;
  totalPinjaman: number;
}
