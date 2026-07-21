/*
  Skrip ini dijalankan di dev container (node) untuk memicu rekalkulasi setiap anggota.
  Cara pakai:
    1. Pastikan environment sudah punya kredensial Firebase (opsional: gunakan serviceAccount jika butuh admin SDK).
    2. Jalankan: `npm run recalc:all` (script ini akan ditambahkan ke package.json oleh Anda)

  Implementasi ini menggunakan Firestore client yang sudah digunakan di app (firebaseConfig.ts).
  Skrip melakukan:
    - Ambil semua dokumen `keuangan` (anggota)
    - Untuk tiap anggota, ambil semua `history` months terurut dan rekalkulasi berurutan
    - Tulis kembali dokumen history dan main doc untuk anggota itu

  Catatan: skrip ini bisa memakan waktu lama tergantung jumlah anggota dan riwayat. Jalankan di environment yang terhubung ke project Firebase yang benar.
*/

import 'cross-fetch/polyfill';
import { collection, doc, getDocs, getDoc, writeBatch, query, orderBy } from 'firebase/firestore';
import { calculateAkhir } from '../services/keuanganService';
import { db } from '../firebaseConfig';

(async () => {
  try {
    console.log('Mengambil semua anggota dari koleksi `keuangan`...');
    const keuanganColl = collection(db, 'keuangan');
    const snapshot = await getDocs(keuanganColl);
    const anggotaDocs = snapshot.docs;

    console.log(`Ditemukan ${anggotaDocs.length} anggota. Memproses satu per satu...`);

    for (const docSnap of anggotaDocs) {
      const no_anggota = docSnap.id;
      console.log(`Memproses anggota ${no_anggota} ...`);

      // Ambil semua history month untuk anggota ini
      const historyColl = collection(db, 'keuangan', no_anggota, 'history');
      const q = query(historyColl, orderBy('periode', 'asc'));
      const historySnapshot = await getDocs(q);

      // Jika tidak ada history, lewati
      if (historySnapshot.empty) {
        console.log(` - Tidak ada history untuk ${no_anggota}, lewati.`);
        continue;
      }

      let currentState: any = null;
      const batch = writeBatch(db);

      for (const h of historySnapshot.docs) {
        const historyData = h.data() as any;
        const periode = historyData.periode;

        if (!currentState) {
          // Ambil prev state dari main doc atau gunakan awal dari dokumen history
          const prevMonth = new Date(new Date(`${periode}-02`).setMonth(new Date(`${periode}-02`).getMonth() - 1)).toISOString().slice(0,7);
          const prevHistoryRef = doc(db, 'keuangan', no_anggota, 'history', prevMonth);
          const prevHistorySnap = await getDoc(prevHistoryRef);
          if (prevHistorySnap.exists()) {
            currentState = prevHistorySnap.data();
          } else {
            const mainRef = doc(db, 'keuangan', no_anggota);
            const mainSnap = await getDoc(mainRef);
            currentState = mainSnap.exists() ? mainSnap.data() : null;
          }

          if (!currentState) {
            // buat state kosong
            currentState = {
              no: 0,
              no_anggota,
              nama_angota: historyData.nama_angota || '',
              awal_simpanan_pokok: 0, awal_simpanan_wajib: 0, sukarela: 0, awal_simpanan_wisata: 0,
              akhir_simpanan_pokok: 0, akhir_simpanan_wajib: 0, akhir_simpanan_sukarela: 0, akhir_simpanan_wisata: 0,
              awal_pinjaman_berjangka: 0, awal_pinjaman_khusus: 0, awal_pinjaman_niaga: 0,
              akhir_pinjaman_berjangka: 0, akhir_pinjaman_khusus: 0, akhir_pinjaman_niaga: 0,
              jumlah_total_simpanan: 0, jumlah_total_pinjaman: 0,
            };
          }
        }

        // Gunakan calculateAkhir dari layanan untuk menghitung akhir
        const awalData = {
          awal_simpanan_pokok: currentState.akhir_simpanan_pokok,
          awal_simpanan_wajib: currentState.akhir_simpanan_wajib,
          sukarela: currentState.akhir_simpanan_sukarela,
          awal_simpanan_wisata: currentState.akhir_simpanan_wisata,
          awal_pinjaman_berjangka: currentState.akhir_pinjaman_berjangka,
          awal_pinjaman_khusus: currentState.akhir_pinjaman_khusus,
          awal_pinjaman_niaga: currentState.akhir_pinjaman_niaga,
        };

        // Ambil nilai transaksi dari historyData (fields yang start dengan 'transaksi_')
        const txFields: any = {};
        Object.keys(historyData).forEach(k => {
          if (k.startsWith('transaksi_')) txFields[k] = Number(historyData[k]) || 0;
        });

        const akhir = calculateAkhir({ ...currentState, ...awalData }, txFields);

        const newMonthlyState = {
          ...historyData,
          ...awalData,
          ...akhir,
        };

        const historyRef = doc(db, 'keuangan', no_anggota, 'history', periode);
        batch.set(historyRef, newMonthlyState, { merge: true });

        currentState = newMonthlyState;
      }

      // setelah semua history, update main doc
      const mainRef = doc(db, 'keuangan', no_anggota);
      batch.set(mainRef, currentState, { merge: true });

      await batch.commit();
      console.log(` - Selesai memproses ${no_anggota}.`);
    }

    console.log('Semua anggota telah diproses.');
    process.exit(0);
  } catch (err) {
    console.error('Error saat menjalankan rekalkulasi all members:', err);
    process.exit(1);
  }
})();
