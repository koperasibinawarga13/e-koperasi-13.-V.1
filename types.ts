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
  password?: string;
  nama: string;
  nik?: string;
  alamat?: string;
  no_telepon?: string;
  email?: string;
  tanggal_bergabung?: string;
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

export interface Keuangan {
  id?: string;
  no: number;
  no_anggota: string;
  nama_angota: string;
  awal_simpanan_pokok: number;
  awal_simpanan_wajib: number;
  sukarela: number;
  awal_simpanan_wisata: number;
  awal_pinjaman_berjangka: number;
  awal_pinjaman_khusus: number;
  transaksi_simpanan_pokok: number;
  transaksi_simpanan_wajib: number;
  transaksi_simpanan_sukarela: number;
  transaksi_simpanan_wisata: number;
  transaksi_pinjaman_berjangka: number;
  transaksi_pinjaman_khusus: number;
  transaksi_simpanan_jasa: number;
  transaksi_niaga: number;
  transaksi_dana_perlaya: number;
  transaksi_dana_katineng: number;
  Jumlah_setoran: number;
  transaksi_pengambilan_simpanan_pokok: number;
  transaksi_pengambilan_simpanan_wajib: number;
  transaksi_pengambilan_simpanan_sukarela: number;
  transaksi_pengambilan_simpanan_wisata: number;
  transaksi_penambahan_pinjaman_berjangka: number;
  transaksi_penambahan_pinjaman_khusus: number;
  transaksi_penambahan_pinjaman_niaga: number;
  akhir_simpanan_pokok: number;
  akhir_simpanan_wajib: number;
  akhir_simpanan_sukarela: number;
  akhir_simpanan_wisata: number;
  akhir_pinjaman_berjangka: number;
  akhir_pinjaman_khusus: number;
  jumlah_total_simpanan: number;
  jumlah_total_pinjaman: number;
}

export interface TransaksiBulanan {
  no_anggota: string;
  transaksi_simpanan_pokok: number;
  transaksi_simpanan_wajib: number;
  transaksi_simpanan_sukarela: number;
  transaksi_simpanan_wisata: number;
  transaksi_pinjaman_berjangka: number;
  transaksi_pinjaman_khusus: number;
  transaksi_simpanan_jasa: number;
  transaksi_niaga: number;
  transaksi_dana_perlaya: number;
  transaksi_dana_katineng: number;
  Jumlah_setoran: number;
  transaksi_pengambilan_simpanan_pokok: number;
  transaksi_pengambilan_simpanan_wajib: number;
  transaksi_pengambilan_simpanan_sukarela: number;
  transaksi_pengambilan_simpanan_wisata: number;
  transaksi_penambahan_pinjaman_berjangka: number;
  transaksi_penambahan_pinjaman_khusus: number;
  transaksi_penambahan_pinjaman_niaga: number;
}

export interface PengajuanPinjaman {
  id?: string;
  no_anggota: string;
  nama_anggota: string;
  pokok_pinjaman: number;
  jangka_waktu: number;
  bunga_per_bulan: number;
  tanggal_pengajuan: string; // ISO string
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  angsuran_pokok_bulan?: number;
  total_bunga?: number;
  total_bayar?: number;
  jadwal_angsuran?: Array<any>;
}
