import { collection, addDoc, getDocs, query, where, doc, updateDoc, orderBy, getDoc, deleteDoc } from 'firebase/firestore';
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

// Get all loan applications
export const getAllPengajuanPinjaman = async (): Promise<PengajuanPinjaman[]> => {
    try {
        const q = query(pengajuanCollectionRef, orderBy("tanggal_pengajuan", "desc"));
        const data = await getDocs(q);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as PengajuanPinjaman));
    } catch (error) {
        console.error(`Error fetching all loan applications: `, error);
        return [];
    }
}

// Get loan applications by status
export const getPengajuanPinjamanByStatus = async (status: string): Promise<PengajuanPinjaman[]> => {
    try {
        // Query without orderBy to avoid composite index requirement
        const q = query(pengajuanCollectionRef, where("status", "==", status));
        const data = await getDocs(q);
        const results = data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as PengajuanPinjaman));
        
        // Sort results client-side by date in descending order
        results.sort((a, b) => new Date(b.tanggal_pengajuan).getTime() - new Date(a.tanggal_pengajuan).getTime());

        return results;
    } catch (error)
        {
        console.error(`Error fetching loan applications with status ${status}: `, error);
        return [];
    }
};

export const getPengajuanPinjamanByNoAnggota = async (no_anggota: string): Promise<PengajuanPinjaman[]> => {
    try {
        const q = query(pengajuanCollectionRef, where("no_anggota", "==", no_anggota));
        const data = await getDocs(q);
        const results = data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as PengajuanPinjaman));
        
        // Sort client-side to avoid composite index
        results.sort((a, b) => new Date(b.tanggal_pengajuan).getTime() - new Date(a.tanggal_pengajuan).getTime());

        return results;
    } catch (error) {
        console.error(`Error fetching loan applications for member ${no_anggota}: `, error);
        return [];
    }
};

// Update the status of a loan application
export const updatePengajuanStatus = async (id: string, newStatus: 'Disetujui' | 'Ditolak', catatan_admin?: string): Promise<void> => {
    try {
        const docRef = doc(db, 'pengajuan_pinjaman', id);
        await updateDoc(docRef, {
            status: newStatus,
            catatan_admin: catatan_admin || ''
        });
    } catch (error) {
        console.error(`Error updating status for application ${id}: `, error);
        throw error;
    }
};

export const deletePengajuanPinjaman = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, 'pengajuan_pinjaman', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting loan application ${id}: `, error);
        throw error;
    }
};

export const getPengajuanPinjamanById = async (id: string): Promise<PengajuanPinjaman | null> => {
    try {
        const docRef = doc(db, 'pengajuan_pinjaman', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as PengajuanPinjaman;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching loan application with id ${id}: `, error);
        return null;
    }
};