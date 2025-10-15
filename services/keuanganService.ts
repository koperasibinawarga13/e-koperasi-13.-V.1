import { collection, doc, writeBatch, runTransaction, getDocs, getDoc, query, orderBy, documentId } from 'firebase/firestore';
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

export const getLaporanBulanan = async (no_anggota: string, month: string): Promise<Keuangan | null> => {
    try {
        const docRef = doc(db, 'keuangan', no_anggota, 'history', month);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Keuangan;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching monthly report for ${no_anggota}, month ${month}:`, error);
        return null;
    }
};

export const getAvailableLaporanMonths = async (no_anggota: string): Promise<string[]> => {
    try {
        const historyCollectionRef = collection(db, 'keuangan', no_anggota, 'history');
        const q = query(historyCollectionRef, orderBy(documentId(), "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.id); // doc.id is 'YYYY-MM'
    } catch (error) {
        console.error(`Error fetching available months for ${no_anggota}:`, error);
        return [];
    }
};


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

export const batchProcessTransaksiBulanan = async (transaksiList: TransaksiBulanan[], month: string): Promise<{successCount: number, errorCount: number, errors: any[]}> => {
    let successCount = 0;
    let errorCount = 0;
    const errors: { no_anggota: string; error: string }[] = [];

    if (!/^\d{4}-\d{2}$/.test(month)) {
        errors.push({ no_anggota: 'SYSTEM', error: 'Format bulan tidak valid. Gunakan YYYY-MM.' });
        return { successCount: 0, errorCount: transaksiList.length, errors };
    }

    for (const tx of transaksiList) {
        if (!tx.no_anggota) {
            errorCount++;
            errors.push({ no_anggota: 'TIDAK DIKETAHUI', error: 'Kolom no_anggota kosong.' });
            continue;
        }
        
        const mainDocRef = doc(db, 'keuangan', tx.no_anggota);
        const historyDocRef = doc(db, 'keuangan', tx.no_anggota, 'history', month);


        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(mainDocRef);

                if (!docSnap.exists()) {
                    throw new Error(`Data keuangan untuk anggota ${tx.no_anggota} tidak ditemukan. Mohon unggah data awal terlebih dahulu.`);
                }

                const prevMonthData = docSnap.data() as Keuangan;
                const newReport: Keuangan = { ...prevMonthData, ...tx, periode: month };

                // Set new "awal" values from previous "akhir"
                newReport.awal_simpanan_pokok = prevMonthData.akhir_simpanan_pokok || 0;
                newReport.awal_simpanan_wajib = prevMonthData.akhir_simpanan_wajib || 0;
                newReport.sukarela = prevMonthData.akhir_simpanan_sukarela || 0;
                newReport.awal_simpanan_wisata = prevMonthData.akhir_simpanan_wisata || 0;
                newReport.awal_pinjaman_berjangka = prevMonthData.akhir_pinjaman_berjangka || 0;
                newReport.awal_pinjaman_khusus = prevMonthData.akhir_pinjaman_khusus || 0;
                
                // Recalculate "akhir" values
                newReport.akhir_simpanan_pokok = newReport.awal_simpanan_pokok + (tx.transaksi_simpanan_pokok || 0) - (tx.transaksi_pengambilan_simpanan_pokok || 0);
                newReport.akhir_simpanan_wajib = newReport.awal_simpanan_wajib + (tx.transaksi_simpanan_wajib || 0) - (tx.transaksi_pengambilan_simpanan_wajib || 0);
                newReport.akhir_simpanan_sukarela = newReport.sukarela + (tx.transaksi_simpanan_sukarela || 0) - (tx.transaksi_pengambilan_simpanan_sukarela || 0);
                newReport.akhir_simpanan_wisata = newReport.awal_simpanan_wisata + (tx.transaksi_simpanan_wisata || 0) - (tx.transaksi_pengambilan_simpanan_wisata || 0);
                
                newReport.akhir_pinjaman_berjangka = newReport.awal_pinjaman_berjangka - (tx.transaksi_pinjaman_berjangka || 0) + (tx.transaksi_penambahan_pinjaman_berjangka || 0);
                newReport.akhir_pinjaman_khusus = newReport.awal_pinjaman_khusus - (tx.transaksi_pinjaman_khusus || 0) + (tx.transaksi_penambahan_pinjaman_khusus || 0);
                
                // Recalculate totals
                newReport.jumlah_total_simpanan = 
                    (newReport.akhir_simpanan_pokok || 0) + 
                    (newReport.akhir_simpanan_wajib || 0) + 
                    (newReport.akhir_simpanan_sukarela || 0) + 
                    (newReport.akhir_simpanan_wisata || 0);

                newReport.jumlah_total_pinjaman = 
                    (newReport.akhir_pinjaman_berjangka || 0) + 
                    (newReport.akhir_pinjaman_khusus || 0);

                transaction.set(mainDocRef, newReport);
                transaction.set(historyDocRef, newReport);
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