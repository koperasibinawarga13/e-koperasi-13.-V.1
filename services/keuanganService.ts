import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  setDoc,
  deleteDoc,
  updateDoc,
  runTransaction,
  query,
  where,
  arrayUnion,
  arrayRemove,
  collectionGroup,
  // FIX: Import 'orderBy' to enable sorting in Firestore queries.
  orderBy,
  // FIX: Import 'CollectionReference' for type-safe collection operations.
  CollectionReference
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Keuangan, TransaksiBulanan, TransaksiLog } from '../types';
import { batchCreateUploadLogs, deleteLogsByPeriod, getLogsByPeriod, getUploadLogsByPeriod, getLogsByUploadSession, getLogById as getLogByIdService } from './transaksiLogService';

const keuanganCollectionRef = collection(db, 'keuangan');
const metadataCollectionRef = collection(db, 'metadata');
const UPLOAD_HISTORY_DOC_ID = '_upload_history';

// Helper function to calculate final balances
export const calculateAkhir = (awal: Partial<Keuangan>, tx: Partial<TransaksiBulanan>): { [key: string]: number } => {
    const awal_sp = awal.awal_simpanan_pokok ?? awal.akhir_simpanan_pokok ?? 0;
    const awal_sw = awal.awal_simpanan_wajib ?? awal.akhir_simpanan_wajib ?? 0;
    const awal_ss = awal.sukarela ?? awal.akhir_simpanan_sukarela ?? 0;
    const awal_swi = awal.awal_simpanan_wisata ?? awal.akhir_simpanan_wisata ?? 0;
    const awal_pb = awal.awal_pinjaman_berjangka ?? awal.akhir_pinjaman_berjangka ?? 0;
    const awal_pk = awal.awal_pinjaman_khusus ?? awal.akhir_pinjaman_khusus ?? 0;
    const awal_pn = awal.awal_pinjaman_niaga ?? awal.akhir_pinjaman_niaga ?? 0;

    const akhir_simpanan_pokok = awal_sp + (tx.transaksi_simpanan_pokok ?? 0) - (tx.transaksi_pengambilan_simpanan_pokok ?? 0);
    const akhir_simpanan_wajib = awal_sw + (tx.transaksi_simpanan_wajib ?? 0) - (tx.transaksi_pengambilan_simpanan_wajib ?? 0);
    const akhir_simpanan_sukarela = awal_ss + (tx.transaksi_simpanan_sukarela ?? 0) - (tx.transaksi_pengambilan_simpanan_sukarela ?? 0);
    const akhir_simpanan_wisata = awal_swi + (tx.transaksi_simpanan_wisata ?? 0) - (tx.transaksi_pengambilan_simpanan_wisata ?? 0);
    
    const akhir_pinjaman_berjangka = awal_pb - (tx.transaksi_pinjaman_berjangka ?? 0) + (tx.transaksi_penambahan_pinjaman_berjangka ?? 0);
    const akhir_pinjaman_khusus = awal_pk - (tx.transaksi_pinjaman_khusus ?? 0) + (tx.transaksi_penambahan_pinjaman_khusus ?? 0);
    const akhir_pinjaman_niaga = awal_pn - (tx.transaksi_niaga ?? 0) + (tx.transaksi_penambahan_pinjaman_niaga ?? 0);
    
    return {
        akhir_simpanan_pokok,
        akhir_simpanan_wajib,
        akhir_simpanan_sukarela,
        akhir_simpanan_wisata,
        jumlah_total_simpanan: akhir_simpanan_pokok + akhir_simpanan_wajib + akhir_simpanan_sukarela + akhir_simpanan_wisata,
        akhir_pinjaman_berjangka,
        akhir_pinjaman_khusus,
        akhir_pinjaman_niaga,
        jumlah_total_pinjaman: akhir_pinjaman_berjangka + akhir_pinjaman_khusus + akhir_pinjaman_niaga,
    };
};

export const getKeuangan = async (): Promise<Keuangan[]> => {
    try {
        const data = await getDocs(keuanganCollectionRef);
        // FIX: Cast doc.data() to Keuangan to resolve spread type error.
        return data.docs.map((doc) => ({ ...(doc.data() as Keuangan), id: doc.id }));
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
            // FIX: Cast docSnap.data() to Keuangan to resolve spread type error.
            return { ...(docSnap.data() as Keuangan), id: docSnap.id };
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

export interface UploadSession {
    id: string;
    month: string;
    admin_nama: string;
    rowCount: number;
    createdAt: string;
}

export interface MonthUploadHistory {
    month: string;
    sessions: UploadSession[];
}

const transaksiFields: Array<keyof TransaksiBulanan> = [
    'transaksi_simpanan_pokok',
    'transaksi_simpanan_wajib',
    'transaksi_simpanan_sukarela',
    'transaksi_simpanan_wisata',
    'transaksi_pinjaman_berjangka',
    'transaksi_pinjaman_khusus',
    'transaksi_simpanan_jasa',
    'transaksi_niaga',
    'transaksi_dana_perlaya',
    'transaksi_dana_katineng',
    'Jumlah_setoran',
    'transaksi_pengambilan_simpanan_pokok',
    'transaksi_pengambilan_simpanan_wajib',
    'transaksi_pengambilan_simpanan_sukarela',
    'transaksi_pengambilan_simpanan_wisata',
    'transaksi_penambahan_pinjaman_berjangka',
    'transaksi_penambahan_pinjaman_khusus',
    'transaksi_penambahan_pinjaman_niaga',
];

const createEmptyKeuangan = (no_anggota: string, nama_angota = ''): Keuangan => ({
    no: 0,
    no_anggota,
    nama_angota,
    periode: '',
    awal_simpanan_pokok: 0,
    awal_simpanan_wajib: 0,
    sukarela: 0,
    awal_simpanan_wisata: 0,
    awal_pinjaman_berjangka: 0,
    awal_pinjaman_khusus: 0,
    awal_pinjaman_niaga: 0,
    transaksi_simpanan_pokok: 0,
    transaksi_simpanan_wajib: 0,
    transaksi_simpanan_sukarela: 0,
    transaksi_simpanan_wisata: 0,
    transaksi_pinjaman_berjangka: 0,
    transaksi_pinjaman_khusus: 0,
    transaksi_simpanan_jasa: 0,
    transaksi_niaga: 0,
    transaksi_dana_perlaya: 0,
    transaksi_dana_katineng: 0,
    Jumlah_setoran: 0,
    transaksi_pengambilan_simpanan_pokok: 0,
    transaksi_pengambilan_simpanan_wajib: 0,
    transaksi_pengambilan_simpanan_sukarela: 0,
    transaksi_pengambilan_simpanan_wisata: 0,
    transaksi_penambahan_pinjaman_berjangka: 0,
    transaksi_penambahan_pinjaman_khusus: 0,
    transaksi_penambahan_pinjaman_niaga: 0,
    akhir_simpanan_pokok: 0,
    akhir_simpanan_wajib: 0,
    akhir_simpanan_sukarela: 0,
    akhir_simpanan_wisata: 0,
    akhir_pinjaman_berjangka: 0,
    akhir_pinjaman_khusus: 0,
    akhir_pinjaman_niaga: 0,
    jumlah_total_simpanan: 0,
    jumlah_total_pinjaman: 0,
});

export const processSingleTransaksi = async (tx: TransaksiBulanan, periode: string, adminName?: string): Promise<UploadResult> => {
    return batchProcessTransaksiBulanan([tx], periode, adminName);
}

const uploadSessionsCollectionRef = collection(db, 'upload_sessions');

export const createUploadSession = async (month: string, rowCount: number, adminName?: string): Promise<string> => {
    const sessionDocRef = doc(uploadSessionsCollectionRef);
    const sessionData: UploadSession = {
        id: sessionDocRef.id,
        month,
        admin_nama: adminName || 'Sistem',
        rowCount,
        createdAt: new Date().toISOString(),
    };
    await setDoc(sessionDocRef, sessionData);
    const historyMetaDoc = doc(metadataCollectionRef, UPLOAD_HISTORY_DOC_ID);
    await setDoc(historyMetaDoc, { months: arrayUnion(month) }, { merge: true });
    return sessionDocRef.id;
};

export const getUploadSessionsForMonth = async (month: string): Promise<UploadSession[]> => {
    const q = query(uploadSessionsCollectionRef, where('month', '==', month));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...(doc.data() as UploadSession), id: doc.id }));
};

export const getHistoryMonthCounts = async (): Promise<Record<string, number>> => {
    const counts: Record<string, number> = {};
    try {
        const snapshot = await getDocs(collectionGroup(db, 'history'));
        snapshot.forEach(doc => {
            const month = doc.id;
            counts[month] = (counts[month] || 0) + 1;
        });
    } catch (error) {
        console.error('Error fetching history month counts:', error);
    }
    return counts;
};

export const getUploadMonthsFromCollection = async (): Promise<string[]> => {
    try {
        const snapshot = await getDocs(uploadSessionsCollectionRef);
        const months = new Set<string>();
        snapshot.docs.forEach(doc => {
            const data = doc.data() as UploadSession;
            if (data.month) {
                months.add(data.month);
            }
        });
        return Array.from(months).sort((a, b) => b.localeCompare(a));
    } catch (error) {
        console.error('Error fetching upload session months from collection:', error);
        return [];
    }
};

export const getUploadHistory = async (): Promise<MonthUploadHistory[]> => {
    const historyCounts = await getHistoryMonthCounts();
    let months = await getUploadedMonths();
    if (months.length === 0) {
        months = await getUploadMonthsFromCollection();
    }
    if (months.length === 0) {
        months = Object.keys(historyCounts).sort((a, b) => b.localeCompare(a));
    }

    const history: MonthUploadHistory[] = [];

    for (const month of months) {
        let sessions = await getUploadSessionsForMonth(month);
        if (sessions.length === 0 && historyCounts[month]) {
            sessions = [{
                id: `history-fallback-${month}`,
                month,
                admin_nama: 'Riwayat Lama',
                rowCount: historyCounts[month],
                createdAt: '',
            }];
        }
        history.push({ month, sessions: sessions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')) });
    }

    return history;
};

const buildHistoryFromLogs = (prevData: Keuangan, logs: TransaksiLog[]): Keuangan => {
    const totals = logs.reduce((acc, log) => {
        transaksiFields.forEach((field) => {
            acc[field] = (acc[field] || 0) + (Number(log[field]) || 0);
        });
        if (!acc.nama_angota) {
            acc.nama_angota = log.nama_angota || prevData.nama_angota || '';
        }
        return acc;
    }, { no_anggota: prevData.no_anggota, nama_angota: prevData.nama_angota } as any) as Partial<TransaksiBulanan>;

    const awalData = {
        awal_simpanan_pokok: prevData.akhir_simpanan_pokok,
        awal_simpanan_wajib: prevData.akhir_simpanan_wajib,
        sukarela: prevData.akhir_simpanan_sukarela,
        awal_simpanan_wisata: prevData.akhir_simpanan_wisata,
        awal_pinjaman_berjangka: prevData.akhir_pinjaman_berjangka,
        awal_pinjaman_khusus: prevData.akhir_pinjaman_khusus,
        awal_pinjaman_niaga: prevData.akhir_pinjaman_niaga,
    };

    const akhirData = calculateAkhir({ ...prevData, ...awalData }, totals as TransaksiBulanan);

    return {
        ...prevData,
        ...totals,
        ...awalData,
        ...akhirData,
        periode: logs[0]?.periode || prevData.periode,
        tanggal_transaksi: logs[0]?.tanggal_transaksi || new Date().toISOString().split('T')[0],
        admin_nama: logs[0]?.admin_nama || prevData.admin_nama || 'Sistem',
    } as Keuangan;
};

export const rebuildFinancialData = async (): Promise<void> => {
    const months = await getUploadedMonths();
    const sortedMonths = [...months].sort((a, b) => a.localeCompare(b));
    const latestState = new Map<string, Keuangan>();

    for (const month of sortedMonths) {
        const allLogs = await getLogsByPeriod(month);
        const uploadLogs = allLogs.filter(log => log.type === 'UPLOAD BULANAN');
        const logsByMember = new Map<string, TransaksiLog[]>();

        uploadLogs.forEach((log) => {
            if (!logsByMember.has(log.no_anggota)) logsByMember.set(log.no_anggota, []);
            logsByMember.get(log.no_anggota)!.push(log);
        });

        const batch = writeBatch(db);

        for (const [no_anggota, memberLogs] of logsByMember) {
            const prevMonth = new Date(new Date(`${month}-02`).setMonth(new Date(`${month}-02`).getMonth() - 1)).toISOString().slice(0, 7);
            let prevState = latestState.get(no_anggota);

            if (!prevState) {
                const prevHistoryDocRef = doc(db, 'keuangan', no_anggota, 'history', prevMonth);
                const prevHistorySnap = await getDoc(prevHistoryDocRef);
                if (prevHistorySnap.exists()) {
                    prevState = prevHistorySnap.data() as Keuangan;
                } else {
                    const currentKeuanganDocRef = doc(db, 'keuangan', no_anggota);
                    const currentKeuanganSnap = await getDoc(currentKeuanganDocRef);
                    prevState = currentKeuanganSnap.exists() ? (currentKeuanganSnap.data() as Keuangan) : createEmptyKeuangan(no_anggota);
                }
            }

            const updatedHistory = buildHistoryFromLogs(prevState, memberLogs);
            const historyDocRef = doc(db, 'keuangan', no_anggota, 'history', month);
            batch.set(historyDocRef, updatedHistory);
            latestState.set(no_anggota, updatedHistory);
        }

        await batch.commit();
    }

    if (latestState.size > 0) {
        const batch = writeBatch(db);
        latestState.forEach((state, no_anggota) => {
            const docRef = doc(db, 'keuangan', no_anggota);
            batch.set(docRef, state, { merge: true });
        });
        await batch.commit();
    }
};

export const deleteUploadSession = async (month: string, sessionId: string): Promise<void> => {
    const sessionDocRef = doc(uploadSessionsCollectionRef, sessionId);
    const logs = await getLogsByUploadSession(month, sessionId);
    const batch = writeBatch(db);

    logs.forEach(log => {
        const logDocRef = doc(db, 'transaksi_logs', log.id);
        batch.delete(logDocRef);
    });

    batch.delete(sessionDocRef);
    await batch.commit();

    const remainingSessions = await getUploadSessionsForMonth(month);
    if (remainingSessions.length === 0) {
        const historyMetaDoc = doc(metadataCollectionRef, UPLOAD_HISTORY_DOC_ID);
        await updateDoc(historyMetaDoc, { months: arrayRemove(month) });
    }

    await rebuildFinancialData();
};

export const batchProcessTransaksiBulanan = async (transaksiList: TransaksiBulanan[], uploadMonth: string, adminName?: string): Promise<UploadResult> => {
    const result: UploadResult = { successCount: 0, errorCount: 0, errors: [] };

    try {
        const sessionId = await createUploadSession(uploadMonth, transaksiList.length, adminName);
        await batchCreateUploadLogs(transaksiList, uploadMonth, adminName, sessionId);
        await rebuildFinancialData();
        result.successCount = transaksiList.length;
    } catch (error: any) {
        result.errorCount = transaksiList.length;
        result.errors = transaksiList.map(tx => ({ no_anggota: tx.no_anggota, error: error?.message || 'Gagal memproses upload.' }));
    }

    return result;
};

export const getUploadedMonths = async (): Promise<string[]> => {
    try {
        const docRef = doc(metadataCollectionRef, UPLOAD_HISTORY_DOC_ID);
        const docSnap = await getDoc(docRef);
        // FIX: Cast Firestore document data to access the 'months' property safely.
        const data = docSnap.data();
        if (docSnap.exists() && data?.months) {
            // FIX: Cast Firestore document data to access the 'months' property safely.
            return (data.months as string[]).sort((a, b) => b.localeCompare(a));
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
    // Get a list of all current members to preserve their names
    const allKeuanganDocs = await getDocs(keuanganCollectionRef);
    const keuanganMap = new Map<string, Keuangan>();
    allKeuanganDocs.forEach(d => keuanganMap.set(d.id, d.data() as Keuangan));

    const logsInPeriod = await getUploadLogsByPeriod(monthToDelete);
    const affectedMembers = [...new Set(logsInPeriod.map(log => log.no_anggota))];

    const batch = writeBatch(db);

    for (const no_anggota of affectedMembers) {
        const docRef = doc(db, 'keuangan', no_anggota);
        const historyDocRef = doc(db, 'keuangan', no_anggota, 'history', monthToDelete);

        // Determine the previous month to revert to
        const prevMonth = new Date(new Date(`${monthToDelete}-02`).setMonth(new Date(`${monthToDelete}-02`).getMonth() - 1)).toISOString().slice(0, 7);
        const prevHistoryDocRef = doc(db, 'keuangan', no_anggota, 'history', prevMonth);
        const prevHistoryDoc = await getDoc(prevHistoryDocRef);

        if (prevHistoryDoc.exists()) {
            // If previous month's data exists, revert to it
            batch.set(docRef, prevHistoryDoc.data());
        } else {
            // If no previous data, reset to a clean slate but keep the name
            const memberName = keuanganMap.get(no_anggota)?.nama_angota || 'Nama Dihapus';
            const emptyKeuangan: Omit<Keuangan, 'id'> = {
                no: 0,
                no_anggota,
                nama_angota: memberName,
                periode: '',
                awal_simpanan_pokok: 0, awal_simpanan_wajib: 0, sukarela: 0, awal_simpanan_wisata: 0, awal_pinjaman_berjangka: 0, awal_pinjaman_khusus: 0, awal_pinjaman_niaga: 0,
                transaksi_simpanan_pokok: 0, transaksi_simpanan_wajib: 0, transaksi_simpanan_sukarela: 0, transaksi_simpanan_wisata: 0, transaksi_pinjaman_berjangka: 0, transaksi_pinjaman_khusus: 0,
                transaksi_simpanan_jasa: 0, transaksi_niaga: 0, transaksi_dana_perlaya: 0, transaksi_dana_katineng: 0, Jumlah_setoran: 0,
                transaksi_pengambilan_simpanan_pokok: 0, transaksi_pengambilan_simpanan_wajib: 0, transaksi_pengambilan_simpanan_sukarela: 0, transaksi_pengambilan_simpanan_wisata: 0,
                transaksi_penambahan_pinjaman_berjangka: 0, transaksi_penambahan_pinjaman_khusus: 0, transaksi_penambahan_pinjaman_niaga: 0,
                akhir_simpanan_pokok: 0, akhir_simpanan_wajib: 0, akhir_simpanan_sukarela: 0, akhir_simpanan_wisata: 0, akhir_pinjaman_berjangka: 0, akhir_pinjaman_khusus: 0, akhir_pinjaman_niaga: 0,
                jumlah_total_simpanan: 0, jumlah_total_pinjaman: 0,
            };
            batch.set(docRef, emptyKeuangan);
        }
        
        // Delete the history document for the selected month
        batch.delete(historyDocRef);
    }
    
    // Delete all transaction logs associated with this period
    await deleteLogsByPeriod(monthToDelete);

    // Remove the month from the central metadata history
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

export const getHistoryByAnggota = async (no_anggota: string): Promise<Keuangan[]> => {
    try {
        const historyCollectionRef = collection(db, 'keuangan', no_anggota, 'history');
        const q = query(historyCollectionRef, orderBy('periode', 'desc'));
        const snapshot = await getDocs(q);
        // FIX: Cast doc.data() to Keuangan to resolve spread type error.
        return snapshot.docs.map(doc => ({ ...(doc.data() as Keuangan), id: doc.id }));
    } catch (error) {
        console.error("Error fetching member history:", error);
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
        return null;
    } catch (error) {
        console.error("Error fetching monthly report: ", error);
        return null;
    }
};

export const getLaporanBulananForAll = async (month: string): Promise<Keuangan[]> => {
    try {
        const historyQuery = query(collectionGroup(db, 'history'), where('periode', '==', month));
        const snapshot = await getDocs(historyQuery);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => doc.data() as Keuangan);
    } catch (error) {
        console.error(`Error fetching monthly report for all members for ${month}: `, error);
        return [];
    }
};

export const correctPastTransaction = async (logId: string, updatedTx: TransaksiBulanan, adminName: string): Promise<void> => {
    await runTransaction(db, async (transaction) => {
        const logDocRef = doc(db, 'transaksi_logs', logId);
        const logDocSnap = await transaction.get(logDocRef);
        if (!logDocSnap.exists()) throw new Error("Log transaksi tidak ditemukan.");
        
        const logDoc = { ...logDocSnap.data(), id: logDocSnap.id } as TransaksiLog;
        const { no_anggota, periode } = logDoc;

        const allMemberHistoryQuery = query(collection(db, 'keuangan', no_anggota, 'history'), where('periode', '>=', periode), orderBy('periode', 'asc'));
        const historySnapshot = await getDocs(allMemberHistoryQuery); // Can't use transaction.get() on queries
        const affectedHistory = historySnapshot.docs.map(d => d.data() as Keuangan);

        const prevPeriod = new Date(new Date(`${periode}-02`).setMonth(new Date(`${periode}-02`).getMonth() - 1)).toISOString().slice(0, 7);
        const prevHistoryDocRef = doc(db, 'keuangan', no_anggota, 'history', prevPeriod);
        const prevHistorySnap = await transaction.get(prevHistoryDocRef);

        // FIX: Critical bug fix for handling the very first transaction where no previous history exists.
        // Ensure currentState is a fully-formed, zeroed-out object.
        let currentState: Keuangan = {
            no: 0, no_anggota, nama_angota: logDoc.nama_angota || '',
            awal_simpanan_pokok: 0, awal_simpanan_wajib: 0, sukarela: 0, awal_simpanan_wisata: 0, awal_pinjaman_berjangka: 0, awal_pinjaman_khusus: 0, awal_pinjaman_niaga: 0,
            akhir_simpanan_pokok: 0, akhir_simpanan_wajib: 0, akhir_simpanan_sukarela: 0, akhir_simpanan_wisata: 0, akhir_pinjaman_berjangka: 0, akhir_pinjaman_khusus: 0, akhir_pinjaman_niaga: 0,
            jumlah_total_simpanan: 0, jumlah_total_pinjaman: 0,
        } as Keuangan;
        
        if (prevHistorySnap.exists()) {
            currentState = { ...currentState, ...(prevHistorySnap.data() as Keuangan) };
        }

        for (const history of affectedHistory) {
            const txForThisMonth = history.periode === periode ? updatedTx : history;
            
            const awalData = {
                awal_simpanan_pokok: currentState.akhir_simpanan_pokok,
                awal_simpanan_wajib: currentState.akhir_simpanan_wajib,
                sukarela: currentState.akhir_simpanan_sukarela,
                awal_simpanan_wisata: currentState.akhir_simpanan_wisata,
                awal_pinjaman_berjangka: currentState.akhir_pinjaman_berjangka,
                awal_pinjaman_khusus: currentState.akhir_pinjaman_khusus,
                awal_pinjaman_niaga: currentState.akhir_pinjaman_niaga,
            };

            const akhirData = calculateAkhir({ ...currentState, ...awalData }, txForThisMonth);

            const newMonthlyState: Keuangan = {
                ...(history as Keuangan), // Preserve any other fields from original history
                ...txForThisMonth,
                ...awalData,
                ...akhirData,
            };
            
            const historyDocRef = doc(db, 'keuangan', no_anggota, 'history', history.periode);
            transaction.set(historyDocRef, newMonthlyState);

            currentState = newMonthlyState;
        }
        
        const mainDocRef = doc(db, 'keuangan', no_anggota);
        transaction.set(mainDocRef, currentState);

        transaction.update(logDocRef, { 
            ...updatedTx,
            type: 'EDIT',
            editedAt: new Date().toISOString(),
            editedBy: adminName,
         });
    });
};

export const resetAllFinancialData = async (): Promise<void> => {
    // Helper to delete all docs in a collection/subcollection in batches
    const deleteCollection = async (collectionRef: CollectionReference) => {
        let querySnapshot = await getDocs(collectionRef);
        while (!querySnapshot.empty) {
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            querySnapshot = await getDocs(collectionRef); // Check again for any remaining documents
        }
    };

    // 1. Get all keuangan documents to iterate over them for subcollection deletion
    const keuanganSnapshot = await getDocs(keuanganCollectionRef);
    
    // 2. Delete all `history` subcollections for each member
    for (const docSnap of keuanganSnapshot.docs) {
        const historyCollectionRef = collection(db, 'keuangan', docSnap.id, 'history');
        await deleteCollection(historyCollectionRef);
    }
    
    // 3. Delete the main `keuangan` documents themselves
    if (!keuanganSnapshot.empty) {
        const deleteKeuanganBatch = writeBatch(db);
        keuanganSnapshot.forEach(doc => {
            deleteKeuanganBatch.delete(doc.ref);
        });
        await deleteKeuanganBatch.commit();
    }

    // 4. Delete all transaction logs
    const logCollectionRef = collection(db, 'transaksi_logs');
    await deleteCollection(logCollectionRef);

    // 5. Reset upload history metadata
    const historyMetaDoc = doc(metadataCollectionRef, UPLOAD_HISTORY_DOC_ID);
    await setDoc(historyMetaDoc, { months: [] });
};
