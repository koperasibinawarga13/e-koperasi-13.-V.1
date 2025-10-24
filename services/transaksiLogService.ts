import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TransaksiLog, Keuangan } from '../types';

const logCollectionRef = collection(db, 'transaksi_logs');

export const createLog = async (data: Omit<TransaksiLog, 'id' | 'log_time'>): Promise<void> => {
    try {
        await addDoc(logCollectionRef, {
            ...data,
            log_time: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error creating transaction log:", error);
        // We don't throw here to avoid blocking the main financial transaction if logging fails
    }
};

export const getLogsByAnggota = async (no_anggota: string): Promise<TransaksiLog[]> => {
    try {
        const q = query(
            logCollectionRef, 
            where("no_anggota", "==", no_anggota),
            orderBy("log_time", "desc")
        );
        const data = await getDocs(q);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as TransaksiLog));
    } catch (error) {
        console.error(`Error fetching logs for member ${no_anggota}:`, error);
        return [];
    }
};

export const getLogById = async (id: string): Promise<TransaksiLog | null> => {
    try {
        const docRef = doc(db, 'transaksi_logs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as TransaksiLog;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching log with id ${id}:`, error);
        return null;
    }
};

// New function to find and create missing logs
export const synchronizeMissingLogs = async (): Promise<{ created: number }> => {
    let createdCount = 0;
    
    // 1. Get all members' financial summaries
    const keuanganCollectionRef = collection(db, 'keuangan');
    const allKeuanganSnap = await getDocs(keuanganCollectionRef);

    for (const keuanganDoc of allKeuanganSnap.docs) {
        const no_anggota = keuanganDoc.id;
        
        // 2. For each member, get their monthly history
        const historyCollectionRef = collection(db, 'keuangan', no_anggota, 'history');
        const historySnap = await getDocs(historyCollectionRef);

        for (const historyDoc of historySnap.docs) {
            const periode = historyDoc.id; // YYYY-MM
            const historyData = historyDoc.data() as Keuangan;
            
            // 3. Check if this transaction was a manual one (has admin_nama)
            if (historyData.admin_nama && historyData.tanggal_transaksi) {
                // 4. Check if a log already exists for this member in this period
                const logQuery = query(
                    logCollectionRef,
                    where("no_anggota", "==", no_anggota),
                    where("periode", "==", periode)
                );
                const logSnap = await getDocs(logQuery);

                // 5. If no log exists, create one from the history data
                if (logSnap.empty) {
                    const { id, no, awal_simpanan_pokok, awal_simpanan_wajib, sukarela, awal_simpanan_wisata, awal_pinjaman_berjangka, awal_pinjaman_khusus, akhir_simpanan_pokok, akhir_simpanan_wajib, akhir_simpanan_sukarela, akhir_simpanan_wisata, akhir_pinjaman_berjangka, akhir_pinjaman_khusus, jumlah_total_simpanan, jumlah_total_pinjaman, ...transaksiFields } = historyData;

                    await createLog({
                        ...(transaksiFields as any),
                        type: 'INPUT BARU',
                        log_time: new Date(historyData.tanggal_transaksi).toISOString(),
                    });
                    createdCount++;
                }
            }
        }
    }
    
    return { created: createdCount };
};
