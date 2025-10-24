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

const transactionFieldsForSync: (keyof Keuangan)[] = [
    'transaksi_simpanan_pokok', 'transaksi_simpanan_wajib', 'transaksi_simpanan_sukarela', 'transaksi_simpanan_wisata',
    'transaksi_pinjaman_berjangka', 'transaksi_pinjaman_khusus', 'transaksi_simpanan_jasa', 'transaksi_niaga',
    'transaksi_dana_perlaya', 'transaksi_dana_katineng', 'Jumlah_setoran', 'transaksi_pengambilan_simpanan_pokok',
    'transaksi_pengambilan_simpanan_wajib', 'transaksi_pengambilan_simpanan_sukarela', 'transaksi_pengambilan_simpanan_wisata',
    'transaksi_penambahan_pinjaman_berjangka', 'transaksi_penambahan_pinjaman_khusus', 'transaksi_penambahan_pinjaman_niaga'
];


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
            const historyData = historyDoc.data() as Keuangan;
            
            // 3. New Robust Check: Does this report have any transaction values?
            const hasTransactions = transactionFieldsForSync.some(field => (historyData as any)[field] > 0);

            if (hasTransactions) {
                const periode = historyDoc.id; // YYYY-MM
                
                // 4. Check if a log already exists for this member in this period
                const logQuery = query(
                    logCollectionRef,
                    where("no_anggota", "==", no_anggota),
                    where("periode", "==", periode)
                );
                const logSnap = await getDocs(logQuery);

                // 5. If there are transactions BUT no log exists, create one.
                if (logSnap.empty) {
                    const { 
                        id, no, awal_simpanan_pokok, awal_simpanan_wajib, sukarela, awal_simpanan_wisata, 
                        awal_pinjaman_berjangka, awal_pinjaman_khusus, akhir_simpanan_pokok, akhir_simpanan_wajib, 
                        akhir_simpanan_sukarela, akhir_simpanan_wisata, akhir_pinjaman_berjangka, akhir_pinjaman_khusus, 
                        jumlah_total_simpanan, jumlah_total_pinjaman, 
                        ...transaksiFields 
                    } = historyData;

                    const logTimestamp = historyData.tanggal_transaksi 
                        ? new Date(historyData.tanggal_transaksi).toISOString() 
                        : new Date(`${periode}-01T12:00:00Z`).toISOString();

                    await addDoc(logCollectionRef, {
                        ...transaksiFields,
                        no_anggota: historyData.no_anggota,
                        nama_angota: historyData.nama_angota,
                        admin_nama: historyData.admin_nama || "Sistem (Sinkronisasi)",
                        periode: periode,
                        type: 'INPUT BARU',
                        log_time: logTimestamp,
                    });
                    createdCount++;
                }
            }
        }
    }
    
    return { created: createdCount };
};
