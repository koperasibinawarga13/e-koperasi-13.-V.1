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
  photoURL?: string;
}

export interface AdminUser {
  id: string;
  nama: string;
  email: string;
  password?: string;
  role: 'admin';
  no_telepon?: string;
  alamat?: string;
}

export interface Anggota {
  id:string;
  no_anggota: string;
  password?: string;
  nama: string;
  nik?: string;
  alamat?: string;
  no_telepon?: string;
  email?: string;
  tanggal_bergabung?: string;
  status: 'Aktif' | 'Tidak Aktif';
  photoURL?: string;
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
  periode?: string; // YYYY-MM
  tanggal_transaksi?: string; // YYYY-MM-DD
  admin_nama?: string;
  awal_simpanan_pokok: number;
  awal_simpanan_wajib: number;
  sukarela: number;
  awal_simpanan_wisata: number;
  awal_pinjaman_berjangka: number;
  awal_pinjaman_khusus: number;
  awal_pinjaman_niaga: number;
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
  akhir_pinjaman_niaga: number;
  jumlah_total_simpanan: number;
  jumlah_total_pinjaman: number;
}

export interface TransaksiBulanan {
  no_anggota: string;
  nama_angota?: string;
  tanggal_transaksi?: string; // YYYY-MM-DD
  admin_nama?: string;
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

export interface TransaksiLog extends TransaksiBulanan {
  id: string;
  log_time: string; // ISO String
  periode: string; // YYYY-MM
  type: 'INPUT BARU' | 'EDIT';
  editedAt?: string; // ISO String
  editedBy?: string;
}


export interface PengajuanPinjaman {
  id?: string;
  no_anggota: string;
  nama_anggota: string;
  pokok_pinjaman: number;
  jangka_waktu?: number;
  bunga_per_bulan?: number;
  tanggal_pengajuan: string; // ISO string
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  angsuran_pokok_bulan?: number;
  total_bunga?: number;
  total_bayar?: number;
  jadwal_angsuran?: Array<any>;
  jenis_pinjaman: 'Berjangka' | 'Khusus';
  metode_perhitungan?: 'Plat Pokok' | 'Plat Total';
  keterangan?: string;
  catatan_admin?: string;
  rencana_pelunasan?: string;
}

export interface Pengumuman {
  id?: string;
  judul: string;
  isi: string;
  tanggal: string; // ISO String
  penulis: string;
}

export interface PengaturanPinjaman {
  sukuBunga: number; // Disimpan sebagai persen, misal 2 untuk 2%
}

export interface PengaturanJasa {
  simpanan_jasa_rat: number;
  simpanan_jasa_shu: number;
  simpanan_jasa_simpanan: number;
  simpanan_jasa_fons_lebaran: number;
  pinjaman_jasa_rat: number;
  pinjaman_jasa_shu: number;
  pinjaman_jasa_simpanan: number;
  pinjaman_jasa_fons_lebaran: number;
  bunga_berjangka: number;
  bunga_khusus: number;
}