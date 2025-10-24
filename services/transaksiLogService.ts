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
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TransaksiLog } from '../types';

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

export const getLogById = async (id: string): Promise<TransaksiLog | null> => {
    try {
        const docRef = doc(db, 'transaksi_logs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as TransaksiLog;
        }
        return null;
    } catch (error) {
        console.error("Error fetching log by ID: ", error);
        return null;
    }
};

export const getLogs = async (): Promise<TransaksiLog[]> => {
    try {
        const q = query(logCollectionRef, orderBy('log_time', 'desc'));
        const data = await getDocs(q);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as TransaksiLog));
    } catch (error) {
        console.error("Error fetching logs: ", error);
        return [];
    }
};

export const getLogsByPeriod = async (periode: string): Promise<TransaksiLog[]> => {
    try {
        const q = query(logCollectionRef, where('periode', '==', periode));
        const data = await getDocs(q);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as TransaksiLog));
    } catch (error) {
        console.error(`Error fetching logs for period ${periode}: `, error);
        return [];
    }
};

export const deleteLogsByPeriod = async (periode: string): Promise<void> => {
    try {
        const logsToDelete = await getLogsByPeriod(periode);
        if (logsToDelete.length === 0) return;

        const batch = writeBatch(db);
        logsToDelete.forEach(log => {
            const docRef = doc(db, 'transaksi_logs', log.id);
            batch.delete(docRef);
        });
        await batch.commit();
    } catch (error) {
        console.error(`Error deleting logs for period ${periode}: `, error);
        throw error;
    }
};

export const updateLog = async (id: string, updatedData: Partial<TransaksiLog>): Promise<void> => {
    try {
        const docRef = doc(db, 'transaksi_logs', id);
        await updateDoc(docRef, updatedData);
    } catch (error) {
        console.error(`Error updating log ${id}: `, error);
        throw error;
    }
};

export const getDistinctLogMonths = async (): Promise<string[]> => {
    try {
        // In Firestore, getting distinct values efficiently requires either a separate
        // metadata document or processing client-side. We'll do the latter for simplicity.
        const allLogs = await getLogs();
        const distinctMonths = [...new Set(allLogs.map(log => log.periode))];
        return distinctMonths.sort((a, b) => b.localeCompare(a)); // Sort descending
    } catch (error) {
        console.error("Error fetching distinct log months: ", error);
        return [];
    }
};
