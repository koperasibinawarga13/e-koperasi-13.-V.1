import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PengajuanPinjaman } from '../types';

const pengajuanCollectionRef = collection(db, 'pengajuan_pinjaman');

// Add a new loan application
export const addPengajuanPinjaman = async (pengajuanData: Omit<PengajuanPinjaman, 'id' | 'status' | 'tanggal_pengajuan'>): Promise<void> => {
    try {
        await addDoc(pengajuanCollectionRef, {
            ...pengajuanData,
            status: 'Menunggu Persetujuan',
            tanggal_pengajuan: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error adding loan application: ", error);
        throw error;
    }
};

// Get loan applications by status
export const getPengajuanPinjamanByStatus = async (status: string): Promise<PengajuanPinjaman[]> => {
    try {
        const q = query(pengajuanCollectionRef, where("status", "==", status));
        const data = await getDocs(q);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as PengajuanPinjaman));
    } catch (error) {
        console.error(`Error fetching loan applications with status ${status}: `, error);
        return [];
    }
};

// Update the status of a loan application
export const updatePengajuanStatus = async (id: string, newStatus: 'Disetujui' | 'Ditolak'): Promise<void> => {
    try {
        const docRef = doc(db, 'pengajuan_pinjaman', id);
        await updateDoc(docRef, {
            status: newStatus
        });
    } catch (error) {
        console.error(`Error updating status for application ${id}: `, error);
        throw error;
    }
};
