import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PengaturanPinjaman, PengaturanJasa } from '../types';

export interface PengaturanKewajiban {
  simpananPokok: number;
  simpananWajibMin: number;
  simpananWajibMax: number;
  danaPerlaya: number;
  danaKatineng: number;
}

const PENGATURAN_DOC_ID = 'kewajiban_anggota_baru';
const pengaturanDocRef = doc(db, 'pengaturan', PENGATURAN_DOC_ID);
const pinjamanDocRef = doc(db, 'pengaturan', 'pinjaman');
const jasaDocRef = doc(db, 'pengaturan', 'jasa_persentase');


export const getPengaturanKewajiban = async (): Promise<PengaturanKewajiban | null> => {
    try {
        const docSnap = await getDoc(pengaturanDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as PengaturanKewajiban;
        }
        return null; // No settings found yet
    } catch (error) {
        console.error("Error fetching kewajiban settings: ", error);
        return null;
    }
};

export const updatePengaturanKewajiban = async (data: PengaturanKewajiban): Promise<void> => {
    try {
        await setDoc(pengaturanDocRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating kewajiban settings: ", error);
        throw error;
    }
};


export const getPengaturanPinjaman = async (): Promise<PengaturanPinjaman | null> => {
    try {
        const docSnap = await getDoc(pinjamanDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as PengaturanPinjaman;
        }
        return null;
    } catch (error) {
        console.error("Error fetching pinjaman settings: ", error);
        return null;
    }
};

export const updatePengaturanPinjaman = async (data: PengaturanPinjaman): Promise<void> => {
    try {
        await setDoc(pinjamanDocRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating pinjaman settings: ", error);
        throw error;
    }
};

export const getPengaturanJasa = async (): Promise<PengaturanJasa | null> => {
    try {
        const docSnap = await getDoc(jasaDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as PengaturanJasa;
        }
        return null;
    } catch (error) {
        console.error("Error fetching jasa settings: ", error);
        return null;
    }
};

export const updatePengaturanJasa = async (data: PengaturanJasa): Promise<void> => {
    try {
        await setDoc(jasaDocRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating jasa settings: ", error);
        throw error;
    }
};

// Maintenance mode helpers
const maintenanceDocRef = doc(db, 'pengaturan', 'maintenance');

export const getMaintenanceMode = async (): Promise<{ enabled: boolean; message?: string }> => {
    try {
        const snap = await getDoc(maintenanceDocRef);
        if (snap.exists()) {
            const data = snap.data() as any;
            return { enabled: !!data.enabled, message: data.message };
        }
        return { enabled: false };
    } catch (error) {
        console.error('Error fetching maintenance mode:', error);
        return { enabled: false };
    }
};

export const setMaintenanceMode = async (enabled: boolean, message?: string): Promise<void> => {
    try {
        await setDoc(maintenanceDocRef, { enabled, message: message || '' }, { merge: true });
    } catch (error) {
        console.error('Error setting maintenance mode:', error);
        throw error;
    }
};