import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PengaturanPinjaman } from '../types';

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