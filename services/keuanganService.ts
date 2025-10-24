import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  setDoc,
  deleteDoc,
  runTransaction,
  query,
  where,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Keuangan, TransaksiBulanan, TransaksiLog } from '../types';
import { deleteLogsByPeriod, getLogsByPeriod, updateLog } from './transaksiLogService';

const keuanganCollectionRef = collection(db, 'keuangan');
const metadataCollectionRef = collection(db, 'metadata');
const UPLOAD_HISTORY_DOC_ID = '_upload_history';

// Helper function to calculate final balances
const calculateAkhir = (awal: Partial<Keuangan>, tx: Partial<TransaksiBulanan>): { [key: string]: number } => {
    const akhir_simpanan_pokok = (awal.awal_simpanan_pokok ?? awal.akhir_simpanan_pokok ?? 0) + (tx.transaksi_simpanan_pokok ?? 0) - (tx.transaksi_pengambilan_simpanan_pokok ?? 0);
    const akhir_simpanan_wajib = (awal.awal_simpanan_wajib ?? awal.akhir_simpanan_wajib ?? 0) + (tx.transaksi_simpanan_wajib ?? 0) - (tx.transaksi_pengambilan_simpanan_wajib ?? 0);
    const akhir_simpanan_sukarela = (awal.sukarela ?? awal.akhir_simpanan_sukarela ?? 0) + (tx.transaksi_simpanan_sukarela ?? 0) - (tx.transaksi_pengambilan_simpanan_sukarela ?? 0);
    const akhir_simpanan_wisata = (awal.awal_simpanan_wisata ?? awal.akhir_simpanan_wisata ?? 0) + (tx.transaksi_simpanan_wisata ?? 0) - (tx.transaksi_pengambilan_simpanan_wisata ?? 0);
    const akhir_pinjaman_berjangka = (awal.awal_pinjaman_berjangka ?? awal.akhir_pinjaman_berjangka ?? 0) - (tx.transaksi_pinjaman_berjangka ?? 0) + (tx.transaksi_penambahan_pinjaman_berjangka ?? 0);
    const akhir_pinjaman_khusus = (awal.awal_pinjaman_khusus ?? awal.akhir_pinjaman_khusus ?? 0) - (tx.transaksi_pinjaman_khusus ?? 0) + (tx.transaksi_penambahan_pinjaman_khusus ?? 0);
    
    return {
        akhir_simpanan_pokok,
        akhir_simpanan_wajib,
        akhir_simpanan_sukarela,
        akhir_simpanan_wisata,
        jumlah_total_simpanan: akhir_simpanan_pokok + akhir_simpanan_wajib + akhir_simpanan_sukarela + akhir_simpanan_wisata,
        akhir_pinjaman_berjangka,
        akhir_pinjaman_khusus,
        jumlah_total_pinjaman: akhir_pinjaman_berjangka + akhir_pinjaman_khusus,
    };
};

export const getKeuangan = async (): Promise<Keuangan[]> => {
    try {
        const data = await getDocs(keuanganCollectionRef);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Keuangan));
    } catch (error) {
        console.error("Error fetching keuangan: ", error);
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
        return null;
    } catch (error) {
        console.error("Error fetching keuangan by no_anggota: ", error);
        return null;
    }
};

export const batchUpsertKeuangan = async (keuanganList: Keuangan[]): Promise<void> => {
    const batch = writeBatch(db);
    keuanganList.forEach((keuangan) => {
        const docRef = doc(db, 'keuangan', keuangan.no_anggota);
        batch.set(docRef, keuangan, { merge: true });
    });
    await batch.commit();
};

interface UploadResult {
    successCount: number;
    errorCount: number;
    errors: { no_anggota: string; error: string }[];
}

export const batchProcessTransaksiBulanan = async (transaksiList: TransaksiBulanan[], uploadMonth: string): Promise<UploadResult> => {
    const result: UploadResult = { successCount: 0, errorCount: 0, errors: [] };
    const batch = writeBatch(db);

    for (const tx of transaksiList) {
        try {
            const docRef = doc(db, 'keuangan', tx.no_anggota);
            const currentDoc = await getDoc(docRef);
            let currentData: Keuangan;

            if (currentDoc.exists()) {
                currentData = currentDoc.data() as Keuangan;
            } else {
                // If member has no financial record, create a zeroed one
                currentData = {
                    no_anggota: tx.no_anggota,
                    nama_angota: tx.nama_angota || '',
                    awal_simpanan_pokok: 0, awal_simpanan_wajib: 0, sukarela: 0, awal_simpanan_wisata: 0, awal_pinjaman_berjangka: 0, awal_pinjaman_khusus: 0,
                    akhir_simpanan_pokok: 0, akhir_simpanan_wajib: 0, akhir_simpanan_sukarela: 0, akhir_simpanan_wisata: 0, akhir_pinjaman_berjangka: 0, akhir_pinjaman_khusus: 0,
                    jumlah_total_simpanan: 0, jumlah_total_pinjaman: 0,
                } as Keuangan;
            }

            // Save previous state to history
            const historyDocRef = doc(db, 'keuangan', tx.no_anggota, 'history', currentData.periode || 'awal');
            batch.set(historyDocRef, currentData);

            const awalData = {
                awal_simpanan_pokok: currentData.akhir_simpanan_pokok,
                awal_simpanan_wajib: currentData.akhir_simpanan_wajib,
                sukarela: currentData.akhir_simpanan_sukarela,
                awal_simpanan_wisata: currentData.akhir_simpanan_wisata,
                awal_pinjaman_berjangka: currentData.akhir_pinjaman_berjangka,
                awal_pinjaman_khusus: currentData.akhir_pinjaman_khusus,
            };

            const akhirData = calculateAkhir({ ...currentData, ...awalData }, tx);
            
            const updatedKeuanganData = {
                ...currentData,
                ...tx,
                ...awalData,
                ...akhirData,
                periode: uploadMonth,
                tanggal_transaksi: tx.tanggal_transaksi || new Date().toISOString().split('T')[0],
                admin_nama: tx.admin_nama,
            };
            
            batch.set(docRef, updatedKeuanganData);
            result.successCount++;
        } catch (error: any) {
            result.errorCount++;
            result.errors.push({ no_anggota: tx.no_anggota, error: error.message });
        }
    }
    
    // Update upload history metadata
    const historyMetaDoc = doc(metadataCollectionRef, UPLOAD_HISTORY_DOC_ID);
    batch.set(historyMetaDoc, { months: arrayUnion(uploadMonth) }, { merge: true });

    await batch.commit();
    return result;
};


export const getUploadedMonths = async (): Promise<string[]> => {
    try {
        const docRef = doc(metadataCollectionRef, UPLOAD_HISTORY_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().months) {
            return (docSnap.data().months as string[]).sort((a, b) => b.localeCompare(a));
        }
        return [];
    } catch (error) {
        return [];
    }
};

export const rebuildUploadHistory = async (): Promise<string[]> => {
    const months = new Set<string>();
    const historyQuery = query(collectionGroup(db, 'history'));
    const snapshot = await getDocs(historyQuery);
    snapshot.forEach(doc => {
        const period = doc.id;
        if (period.match(/^\d{4}-\d{2}$/)) {
            months.add(period);
        }
    });
    const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
    const historyMetaDoc = doc(metadataCollectionRef, UPLOAD_HISTORY_DOC_ID);
    await setDoc(historyMetaDoc, { months: sortedMonths });
    return sortedMonths;
};

export const deleteMonthlyReport = async (monthToDelete: string): Promise<void> => {
    const logsToDelete = await getLogsByPeriod(monthToDelete);
    const affectedMembers = [...new Set(logsToDelete.map(log => log.no_anggota))];

    const batch = writeBatch(db);

    for (const no_anggota of affectedMembers) {
        const docRef = doc(db, 'keuangan', no_anggota);
        const historyDocRef = doc(db, 'keuangan', no_anggota, 'history', monthToDelete);

        // Find the state of the month before the one being deleted
        const prevMonth = new Date(new Date(`${monthToDelete}-02`).setMonth(new Date(`${monthToDelete}-02`).getMonth() - 1)).toISOString().slice(0, 7);
        const prevHistoryDocRef = doc(db, 'keuangan', no_anggota, 'history', prevMonth);
        const prevHistoryDoc = await getDoc(prevHistoryDocRef);

        if (prevHistoryDoc.exists()) {
            batch.set(docRef, prevHistoryDoc.data());
        } else {
            // If there's no previous month, revert to a zeroed state (or delete)
            // For safety, let's keep the user but zero out their balances. A delete might be too destructive.
            const emptyKeuangan = { no: 0, no_anggota, nama_angota: '', awal_simpanan_pokok: 0, awal_simpanan_wajib: 0, sukarela: 0, awal_simpanan_wisata: 0, awal_pinjaman_berjangka: 0, awal_pinjaman_khusus: 0, transaksi_simpanan_pokok: 0, transaksi_simpanan_wajib: 0, transaksi_simpanan_sukarela: 0, transaksi_simpanan_wisata: 0, transaksi_pinjaman_berjangka: 0, transaksi_pinjaman_khusus: 0, transaksi_simpanan_jasa: 0, transaksi_niaga: 0, transaksi_dana_perlaya: 0, transaksi_dana_katineng: 0, Jumlah_setoran: 0, transaksi_pengambilan_simpanan_pokok: 0, transaksi_pengambilan_simpanan_wajib: 0, transaksi_pengambilan_simpanan_sukarela: 0, transaksi_pengambilan_simpanan_wisata: 0, transaksi_penambahan_pinjaman_berjangka: 0, transaksi_penambahan_pinjaman_khusus: 0, transaksi_penambahan_pinjaman_niaga: 0, akhir_simpanan_pokok: 0, akhir_simpanan_wajib: 0, akhir_simpanan_sukarela: 0, akhir_simpanan_wisata: 0, akhir_pinjaman_berjangka: 0, akhir_pinjaman_khusus: 0, jumlah_total_simpanan: 0, jumlah_total_pinjaman: 0 };
            batch.set(docRef, emptyKeuangan);
        }
        
        // Delete the history for the specified month
        batch.delete(historyDocRef);
    }
    
    // Delete the associated transaction logs
    await deleteLogsByPeriod(monthToDelete);

    // Update metadata
    const historyMetaDoc = doc(metadataCollectionRef, UPLOAD_HISTORY_DOC_ID);
    batch.update(historyMetaDoc, { months: arrayRemove(monthToDelete) });

    await batch.commit();
};

export const getAvailableLaporanMonths = async (no_anggota: string): Promise<string[]> => {
    try {
        const historyCollectionRef = collection(db, 'keuangan', no_anggota, 'history');
        const snapshot = await getDocs(historyCollectionRef);
        const months = snapshot.docs.map(doc => doc.id).filter(id => id.match(/^\d{4}-\d{2}$/));
        return months.sort((a, b) => b.localeCompare(a));
    } catch (error) {
        console.error("Error fetching available report months: ", error);
        return [];
    }
};

export const getLaporanBulanan = async (no_anggota: string, month: string): Promise<Keuangan | null> => {
    try {
        const historyDocRef = doc(db, 'keuangan', no_anggota, 'history', month);
        const docSnap = await getDoc(historyDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as Keuangan;
        }
        // Fallback for 'awal' state if it exists
        const awalDocRef = doc(db, 'keuangan', no_anggota, 'history', 'awal');
        const awalDocSnap = await getDoc(awalDocRef);
        if (awalDocSnap.exists()) {
            return awalDocSnap.data() as Keuangan;
        }
        return null;
    } catch (error) {
        console.error("Error fetching monthly report: ", error);
        return null;
    }
};

export const correctPastTransaction = async (logId: string, updatedTx: TransaksiBulanan, adminName: string): Promise<void> => {
    await runTransaction(db, async (transaction) => {
        const logDoc = await getLogById(logId);
        if (!logDoc) throw new Error("Log transaksi tidak ditemukan.");
        
        const { no_anggota, periode } = logDoc;

        // Get all logs for this member from the affected period onwards, sorted by period
        const logsQuery = query(
            collection(db, 'transaksi_logs'), 
            where("no_anggota", "==", no_anggota),
            where("periode", ">=", periode)
        );
        const logsSnapshot = await getDocs(logsQuery);
        const allMemberLogs = logsSnapshot.docs
            .map(d => ({...d.data(), id: d.id} as TransaksiLog))
            .sort((a, b) => a.periode.localeCompare(b.periode));

        // Find the state before the correction
        const prevPeriod = new Date(new Date(`${periode}-02`).setMonth(new Date(`${periode}-02`).getMonth() - 1)).toISOString().slice(0, 7);
        letcurrentState = (await getLaporanBulanan(no_anggota, prevPeriod)) || {
            akhir_simpanan_pokok: 0, akhir_simpanan_wajib: 0, akhir_simpanan_sukarela: 0, akhir_simpanan_wisata: 0,
            akhir_pinjaman_berjangka: 0, akhir_pinjaman_khusus: 0,
        } as Partial<Keuangan>;

        // Recalculate each month forward
        for (const log of allMemberLogs) {
            const txForThisMonth = log.id === logId ? updatedTx : log;
            
            const awalData = {
                awal_simpanan_pokok: currentState.akhir_simpanan_pokok,
                awal_simpanan_wajib: currentState.akhir_simpanan_wajib,
                sukarela: currentState.akhir_simpanan_sukarela,
                awal_simpanan_wisata: currentState.akhir_simpanan_wisata,
                awal_pinjaman_berjangka: currentState.akhir_pinjaman_berjangka,
                awal_pinjaman_khusus: currentState.akhir_pinjaman_khusus,
            };

            const akhirData = calculateAkhir({ ...currentState, ...awalData }, txForThisMonth);

            const newMonthlyState: Keuangan = {
                ...(currentState as Keuangan),
                ...txForThisMonth,
                ...awalData,
                ...akhirData,
                periode: log.periode,
            };
            
            // Update history doc for this month
            const historyDocRef = doc(db, 'keuangan', no_anggota, 'history', log.periode);
            transaction.set(historyDocRef, newMonthlyState);

            currentState = newMonthlyState; // Carry over to next iteration
        }
        
        // Update the main keuangan document with the final recalculated state
        const mainDocRef = doc(db, 'keuangan', no_anggota);
        transaction.set(mainDocRef, currentState);

        // Update the log entry itself to mark it as edited
        const logDocRef = doc(db, 'transaksi_logs', logId);
        transaction.update(logDocRef, { 
            ...updatedTx,
            type: 'EDIT',
            editedAt: new Date().toISOString(),
            editedBy: adminName,
         });
    });
};
