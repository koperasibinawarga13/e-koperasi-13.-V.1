import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TransaksiLog } from '../types';

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