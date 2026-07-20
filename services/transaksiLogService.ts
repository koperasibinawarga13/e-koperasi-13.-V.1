import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TransaksiLog, Keuangan, TransaksiBulanan } from '../types';

const logCollectionRef = collection(db, 'transaksi_logs');

export const createLog = async (logData: Omit<TransaksiLog, 'id' | 'log_time'>): Promise<TransaksiLog> => {
    try {
        const dataToLog = {
            ...logData,
            log_time: new Date().toISOString(),
        };
        const docRef = await addDoc(logCollectionRef, dataToLog);
        return { ...dataToLog, id: docRef.id };
    } catch (error) {
        console.error("Error creating transaction log: ", error);
        throw error;
    }
};

export const batchCreateUploadLogs = async (
    transaksiList: TransaksiBulanan[],
    periode: string,
    adminName?: string,
    uploadSessionId?: string
): Promise<void> => {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();

    transaksiList.forEach((tx) => {
        // Ensure all expected transaction fields exist and are numbers (default 0)
        const normalizedTx: any = {};
        const allFields = [
            'transaksi_simpanan_pokok', 'transaksi_simpanan_wajib', 'transaksi_simpanan_sukarela', 'transaksi_simpanan_wisata',
            'transaksi_pinjaman_berjangka', 'transaksi_pinjaman_khusus', 'transaksi_simpanan_jasa', 'transaksi_niaga',
            'transaksi_dana_perlaya', 'transaksi_dana_katineng', 'Jumlah_setoran', 'transaksi_pengambilan_simpanan_pokok',
            'transaksi_pengambilan_simpanan_wajib', 'transaksi_pengambilan_simpanan_sukarela', 'transaksi_pengambilan_simpanan_wisata',
            'transaksi_penambahan_pinjaman_berjangka', 'transaksi_penambahan_pinjaman_khusus', 'transaksi_penambahan_pinjaman_niaga'
        ];

        // Copy base fields
        normalizedTx.no_anggota = String(tx.no_anggota || '').trim();
        normalizedTx.nama_angota = String(tx.nama_angota || (tx as any).nama_anggota || '').trim();

        // Ensure periode and tanggal_transaksi exist
        normalizedTx.periode = periode;
        normalizedTx.tanggal_transaksi = tx.tanggal_transaksi || new Date().toISOString().split('T')[0];

        // Normalize numeric fields (try exact key, then lowercased key)
        allFields.forEach((field) => {
            const lower = field.toLowerCase();
            const raw = (tx as any)[field] ?? (tx as any)[lower];
            const num = Number(raw);
            normalizedTx[field] = Number.isFinite(num) ? num : 0;
            // also set lowercase variant to be defensive
            normalizedTx[lower] = normalizedTx[field];
        });

        // other meta fields
        normalizedTx.type = 'UPLOAD BULANAN';
        normalizedTx.admin_nama = adminName || tx.admin_nama || 'Sistem';
        normalizedTx.upload_session_id = uploadSessionId;
        normalizedTx.log_time = timestamp;

        const logRef = doc(logCollectionRef);
        batch.set(logRef, normalizedTx);
    });

    await batch.commit();
};

export const getLogById = async (id: string): Promise<TransaksiLog | null> => {
    try {
        const docRef = doc(db, 'transaksi_logs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            // FIX: Cast docSnap.data() to TransaksiLog to resolve spread type error.
            return { ...(docSnap.data() as TransaksiLog), id: docSnap.id };
        }
        return null;
    } catch (error) {
        console.error("Error fetching log by ID: ", error);
        return null;
    }
};

export const getLogsByAnggota = async (no_anggota: string): Promise<TransaksiLog[]> => {
    try {
        // FIX: Removed orderBy to prevent composite index error. Sorting is now done on the client-side.
        const q = query(logCollectionRef, where('no_anggota', '==', no_anggota));
        const data = await getDocs(q);
        // FIX: Cast doc.data() to TransaksiLog to resolve spread type error.
        const logs = data.docs.map(doc => ({...(doc.data() as TransaksiLog), id: doc.id}));
        // Sort client-side
        logs.sort((a, b) => new Date(b.log_time).getTime() - new Date(a.log_time).getTime());
        return logs;
    } catch (error) {
        console.error("Error fetching logs for member:", error);
        return [];
    }
};

export const getLogsByAdminAndPeriod = async (adminName: string, period: string): Promise<TransaksiLog[]> => {
    try {
        // FIX: Removed orderBy to prevent composite index error. Sorting is now done on the client-side.
        const q = query(
            logCollectionRef, 
            where('admin_nama', '==', adminName), 
            where('periode', '==', period)
        );
        const data = await getDocs(q);
        // FIX: Cast doc.data() to TransaksiLog to resolve spread type error.
        const logs = data.docs.map(doc => ({...(doc.data() as TransaksiLog), id: doc.id}));
        // Sort client-side
        logs.sort((a, b) => new Date(a.log_time).getTime() - new Date(b.log_time).getTime());
        return logs;
    } catch (error) {
        console.error("Error fetching logs by admin and period:", error);
        return [];
    }
};


export const getAvailableLogPeriods = async (): Promise<string[]> => {
    try {
        const snapshot = await getDocs(logCollectionRef);
        const periods = new Set<string>();
        snapshot.forEach(doc => {
            // FIX: Cast Firestore document data to TransaksiLog to access the 'periode' property.
            const data = doc.data() as TransaksiLog;
            if (data.periode) {
                // FIX: Cast Firestore document data to TransaksiLog to access the 'periode' property.
                periods.add(data.periode);
            }
        });
        return Array.from(periods).sort((a, b) => b.localeCompare(a)); // Sort descending
    } catch (error) {
        console.error("Error fetching available log periods:", error);
        return [];
    }
};


export const getLogsByPeriod = async (periode: string): Promise<TransaksiLog[]> => {
    try {
        const q = query(logCollectionRef, where('periode', '==', periode));
        const data = await getDocs(q);
        // FIX: Cast doc.data() to TransaksiLog to resolve spread type error.
        return data.docs.map((doc) => ({ ...(doc.data() as TransaksiLog), id: doc.id }));
    } catch (error) {
        console.error(`Error fetching logs for period ${periode}: `, error);
        return [];
    }
};

export const getUploadLogsByPeriod = async (periode: string): Promise<TransaksiLog[]> => {
    const allLogs = await getLogsByPeriod(periode);
    return allLogs.filter(log => log.type === 'UPLOAD BULANAN');
};

export const getLogsByUploadSession = async (periode: string, uploadSessionId: string): Promise<TransaksiLog[]> => {
    try {
        const q = query(logCollectionRef, where('upload_session_id', '==', uploadSessionId));
        const data = await getDocs(q);
        return data.docs
            .map(doc => ({ ...(doc.data() as TransaksiLog), id: doc.id }))
            .filter(log => log.periode === periode);
    } catch (error) {
        console.error(`Error fetching logs for session ${uploadSessionId}: `, error);
        return [];
    }
};

export const deleteLogsByPeriod = async (periode: string): Promise<void> => {
    try {
        const logsToDelete = await getUploadLogsByPeriod(periode);
        if (logsToDelete.length === 0) return;

        const batch = writeBatch(db);
        logsToDelete.forEach(log => {
            const docRef = doc(db, 'transaksi_logs', log.id);
            batch.delete(docRef);
        });
        await batch.commit();
    } catch (error) {
        console.error(`Error deleting upload logs for period ${periode}: `, error);
        throw error;
    }
};

export const createLogFromHistory = async (historyData: Keuangan): Promise<TransaksiLog> => {
    if (!historyData.periode) throw new Error("History data must have a period.");
    
    const { id, no, awal_simpanan_pokok, awal_simpanan_wajib, sukarela, awal_simpanan_wisata, awal_pinjaman_berjangka, awal_pinjaman_khusus, akhir_simpanan_pokok, akhir_simpanan_wajib, akhir_simpanan_sukarela, akhir_simpanan_wisata, akhir_pinjaman_berjangka, akhir_pinjaman_khusus, jumlah_total_simpanan, jumlah_total_pinjaman, ...transaksiFields } = historyData;

    const logData: Omit<TransaksiLog, 'id' | 'log_time'> = {
        ...transaksiFields,
        type: 'INPUT BARU',
        periode: historyData.periode,
    };
    return createLog(logData);
};


export const synchronizeMissingLogs = async (): Promise<number> => {
    let createdCount = 0;
    
    // Get all periods that already have a log
    const allLogsSnapshot = await getDocs(logCollectionRef);
    // FIX: Cast Firestore document data to TransaksiLog to access its properties.
    const existingLogKeys = new Set(allLogsSnapshot.docs.map(doc => {
        const data = doc.data() as TransaksiLog;
        return `${data.no_anggota}_${data.periode}`;
    }));

    // Get all history documents from all members
    const historyQuery = query(collectionGroup(db, 'history'));
    const allHistorySnapshot = await getDocs(historyQuery);

    const batch = writeBatch(db);

    for (const historyDoc of allHistorySnapshot.docs) {
        const historyData = historyDoc.data() as Keuangan;
        const { no_anggota, periode } = historyData;

        if (!no_anggota || !periode || !periode.match(/^\d{4}-\d{2}$/)) {
            continue; // Skip invalid or 'awal' history docs
        }

        const logKey = `${no_anggota}_${periode}`;
        if (existingLogKeys.has(logKey)) {
            continue; // Log already exists, skip
        }
        
        // Check if this history item represents an actual transaction
        const hasTransactions = Object.entries(historyData).some(
            ([key, value]) => key.startsWith('transaksi_') && typeof value === 'number' && value > 0
        );
        
        if (hasTransactions) {
             const { id, no, awal_simpanan_pokok, awal_simpanan_wajib, sukarela, awal_simpanan_wisata, awal_pinjaman_berjangka, awal_pinjaman_khusus, akhir_simpanan_pokok, akhir_simpanan_wajib, akhir_simpanan_sukarela, akhir_simpanan_wisata, akhir_pinjaman_berjangka, akhir_pinjaman_khusus, jumlah_total_simpanan, jumlah_total_pinjaman, ...transaksiFields } = historyData;

            const logData = {
                ...transaksiFields,
                type: 'INPUT BARU',
                periode: historyData.periode,
                admin_nama: historyData.admin_nama || "Sistem (Sinkronisasi)",
                log_time: new Date().toISOString(),
            };
            const newLogRef = doc(logCollectionRef);
            batch.set(newLogRef, logData);
            createdCount++;
        }
    }

    if (createdCount > 0) {
        await batch.commit();
    }
    
    return createdCount;
};
