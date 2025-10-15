import { collection, doc, writeBatch, runTransaction, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Keuangan, TransaksiBulanan } from '../types';

const keuanganCollectionRef = collection(db, 'keuangan');

export const getKeuangan = async (): Promise<Keuangan[]> => {
    try {
        const data = await getDocs(keuanganCollectionRef);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Keuangan));
    } catch (error) {
        console.error("Error fetching financial data: ", error);
        return [];
    }
};

export const getKeuanganByNoAnggota = async (no_anggota: string): Promise<Keuangan | null> => {
    try {
        const docRef = doc(db, 'keuangan', no_anggota);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Keuangan;
        }
        console.warn(`No financial data found for no_anggota: ${no_anggota}`);
        return null;
    } catch (error) {
        console.error(`Error fetching financial data for ${no_anggota}: `, error);
        return null;
    }
}

// Menggunakan no_anggota sebagai ID dokumen untuk operasi upsert (update/insert) yang efisien.
export const batchUpsertKeuangan = async (keuanganList: Keuangan[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        keuanganList.forEach((data) => {
            if (data.no_anggota) {
                // ID Dokumen akan sama dengan nomor anggota
                const docRef = doc(db, 'keuangan', data.no_anggota);
                batch.set(docRef, data);
            }
        });
        await batch.commit();
    } catch (error) {
        console.error("Error upserting financial data in batch: ", error);
        throw error;
    }
};

export const batchProcessTransaksiBulanan = async (transaksiList: TransaksiBulanan[]): Promise<{successCount: number, errorCount: number, errors: any[]}> => {
    let successCount = 0;
    let errorCount = 0;
    const errors: { no_anggota: string; error: string }[] = [];

    for (const tx of transaksiList) {
        if (!tx.no_anggota) {
            errorCount++;
            errors.push({ no_anggota: 'TIDAK DIKETAHUI', error: 'Kolom no_anggota kosong.' });
            continue;
        }
        
        const docRef = doc(db, 'keuangan', tx.no_anggota);

        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);

                if (!docSnap.exists()) {
                    throw new Error(`Data keuangan untuk anggota ${tx.no_anggota} tidak ditemukan. Mohon unggah data awal terlebih dahulu.`);
                }

                const currentData = docSnap.data() as Keuangan;
                
                const updates: Partial<Keuangan> = {};
                
                // Update individual balances first
                updates.akhir_simpanan_pokok = (currentData.akhir_simpanan_pokok || 0) + (tx.transaksi_simpanan_pokok || 0) - (tx.transaksi_pengambilan_simpanan_pokok || 0);
                updates.akhir_simpanan_wajib = (currentData.akhir_simpanan_wajib || 0) + (tx.transaksi_simpanan_wajib || 0) - (tx.transaksi_pengambilan_simpanan_wajib || 0);
                updates.akhir_simpanan_sukarela = (currentData.akhir_simpanan_sukarela || 0) + (tx.transaksi_simpanan_sukarela || 0) - (tx.transaksi_pengambilan_simpanan_sukarela || 0);
                updates.akhir_simpanan_wisata = (currentData.akhir_simpanan_wisata || 0) + (tx.transaksi_simpanan_wisata || 0) - (tx.transaksi_pengambilan_simpanan_wisata || 0);
                
                updates.akhir_pinjaman_berjangka = (currentData.akhir_pinjaman_berjangka || 0) - (tx.transaksi_pinjaman_berjangka || 0) + (tx.transaksi_penambahan_pinjaman_berjangka || 0);
                updates.akhir_pinjaman_khusus = (currentData.akhir_pinjaman_khusus || 0) - (tx.transaksi_pinjaman_khusus || 0) + (tx.transaksi_penambahan_pinjaman_khusus || 0);
                
                // Incrementally update totals based on transactions instead of recalculating
                const totalSetoranSimpanan = (tx.transaksi_simpanan_pokok || 0) + 
                                             (tx.transaksi_simpanan_wajib || 0) + 
                                             (tx.transaksi_simpanan_sukarela || 0) + 
                                             (tx.transaksi_simpanan_wisata || 0);

                const totalPengambilanSimpanan = (tx.transaksi_pengambilan_simpanan_pokok || 0) +
                                                 (tx.transaksi_pengambilan_simpanan_wajib || 0) +
                                                 (tx.transaksi_pengambilan_simpanan_sukarela || 0) +
                                                 (tx.transaksi_pengambilan_simpanan_wisata || 0);
                
                updates.jumlah_total_simpanan = (currentData.jumlah_total_simpanan || 0) + totalSetoranSimpanan - totalPengambilanSimpanan;

                const totalPenambahanPinjaman = (tx.transaksi_penambahan_pinjaman_berjangka || 0) +
                                                (tx.transaksi_penambahan_pinjaman_khusus || 0) +
                                                (tx.transaksi_penambahan_pinjaman_niaga || 0);

                const totalAngsuranPinjaman = (tx.transaksi_pinjaman_berjangka || 0) +
                                              (tx.transaksi_pinjaman_khusus || 0);
                
                updates.jumlah_total_pinjaman = (currentData.jumlah_total_pinjaman || 0) + totalPenambahanPinjaman - totalAngsuranPinjaman;

                transaction.update(docRef, updates);
            });
            successCount++;
        } catch (error) {
            console.error(`Error processing transaction for ${tx.no_anggota}:`, error);
            errorCount++;
            errors.push({ no_anggota: tx.no_anggota, error: (error as Error).message });
        }
    }
    
    return { successCount, errorCount, errors };
};