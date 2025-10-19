import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Pengumuman } from '../types';

const pengumumanCollectionRef = collection(db, 'pengumuman');

export const getPengumuman = async (): Promise<Pengumuman[]> => {
    try {
        const q = query(pengumumanCollectionRef, orderBy('tanggal', 'desc'));
        const data = await getDocs(q);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Pengumuman));
    } catch (error) {
        console.error("Error fetching pengumuman: ", error);
        return [];
    }
};

type NewPengumumanData = Omit<Pengumuman, 'id'>;

export const addPengumuman = async (newPengumuman: NewPengumumanData): Promise<Pengumuman> => {
    try {
        const docRef = await addDoc(pengumumanCollectionRef, newPengumuman);
        return { ...newPengumuman, id: docRef.id };
    } catch (error) {
        console.error("Error adding pengumuman: ", error);
        throw error;
    }
};

export const updatePengumuman = async (updatedPengumuman: Pengumuman): Promise<Pengumuman> => {
    try {
        const pengumumanDoc = doc(db, 'pengumuman', updatedPengumuman.id);
        const { id, ...dataToUpdate } = updatedPengumuman;
        await updateDoc(pengumumanDoc, dataToUpdate);
        return updatedPengumuman;
    } catch (error) {
        console.error("Error updating pengumuman: ", error);
        throw error;
    }
};

export const deletePengumuman = async (id: string): Promise<void> => {
    try {
        const pengumumanDoc = doc(db, 'pengumuman', id);
        await deleteDoc(pengumumanDoc);
    } catch (error) {
        console.error("Error deleting pengumuman: ", error);
        throw error;
    }
};