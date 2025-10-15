// FIX: Implemented full content for anggotaService.ts to handle Firestore operations.
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Anggota } from '../types';

const anggotaCollectionRef = collection(db, 'anggota');

export const getAnggota = async (): Promise<Anggota[]> => {
    try {
        const data = await getDocs(anggotaCollectionRef);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Anggota));
    } catch (error) {
        console.error("Error fetching anggota: ", error);
        return [];
    }
};

export const getAnggotaById = async (id: string): Promise<Anggota | null> => {
    try {
        const docRef = doc(db, 'anggota', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Anggota;
        }
        return null;
    } catch (error) {
        console.error("Error fetching anggota by ID: ", error);
        return null;
    }
};


export const findAnggotaByCredentials = async (no_anggota: string, password: string): Promise<Anggota | null> => {
    try {
        const q = query(anggotaCollectionRef, where("no_anggota", "==", no_anggota), where("password", "==", password));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { ...doc.data(), id: doc.id } as Anggota;
        }
        return null;
    } catch (error) {
        console.error("Error finding anggota by credentials: ", error);
        return null;
    }
};

type NewAnggotaData = Omit<Anggota, 'id'>;
type NewAnggotaFromUpload = Pick<Anggota, 'no_anggota' | 'nama' | 'no_telepon'>;


export const addAnggota = async (newAnggota: NewAnggotaData): Promise<Anggota> => {
    try {
        const docRef = await addDoc(anggotaCollectionRef, newAnggota);
        return { ...newAnggota, id: docRef.id };
    } catch (error) {
        console.error("Error adding anggota: ", error);
        throw error;
    }
};

export const batchAddAnggota = async (anggotaList: NewAnggotaFromUpload[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        anggotaList.forEach((anggota) => {
            const docRef = doc(anggotaCollectionRef); // Automatically generate unique ID
            const fullAnggotaData: Omit<Anggota, 'id'> = {
                no_anggota: anggota.no_anggota,
                nama: anggota.nama,
                no_telepon: anggota.no_telepon,
                password: '', // Password is empty string initially, to be set by user later
                nik: '',
                alamat: '',
                email: '',
                tanggal_bergabung: new Date().toISOString().split('T')[0],
                status: 'Aktif',
            };
            batch.set(docRef, fullAnggotaData);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error adding anggota in batch: ", error);
        throw error;
    }
}

export const registerAnggota = async (no_anggota: string, no_telepon: string, password: string): Promise<void> => {
    try {
        const q = query(anggotaCollectionRef, where("no_anggota", "==", no_anggota));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Nomor anggota tidak ditemukan.");
        }

        const doc = querySnapshot.docs[0];
        const anggotaData = doc.data() as Anggota;

        // Check if password is not an empty string, meaning it's already set
        if (anggotaData.password) {
            throw new Error("Akun ini sudah terdaftar. Silakan login.");
        }

        if (anggotaData.no_telepon !== no_telepon) {
            throw new Error("Nomor HP tidak sesuai dengan data kami.");
        }
        
        // If validation passes, update the document with the new password
        const anggotaDoc = doc(db, 'anggota', doc.id);
        await updateDoc(anggotaDoc, {
            password: password
        });
        
    } catch (error) {
        console.error("Error during member registration:", error);
        throw error; // Re-throw the error to be caught by the component
    }
};

export const updateAnggota = async (updatedAnggota: Anggota): Promise<Anggota> => {
    try {
        const anggotaDoc = doc(db, 'anggota', updatedAnggota.id);
        const { id, ...dataToUpdate } = updatedAnggota;
        await updateDoc(anggotaDoc, dataToUpdate);
        return updatedAnggota;
    } catch (error) {
        console.error("Error updating anggota: ", error);
        throw error;
    }
};

export const deleteAnggota = async (id: string): Promise<void> => {
    try {
        const anggotaDoc = doc(db, 'anggota', id);
        await deleteDoc(anggotaDoc);
    } catch (error) {
        console.error("Error deleting anggota: ", error);
        throw error;
    }
};