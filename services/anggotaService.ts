import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Anggota } from "../types";

const anggotaCollectionRef = collection(db, "anggota");

// Mock data to start with if firestore is empty
const mockAnggota: Omit<Anggota, 'id'>[] = [
    { no_anggota: 'A001', nama: 'Budi Santoso', nik: '3201012345670001', alamat: 'Jl. Merdeka No. 10', no_telepon: '081234567890', tanggal_bergabung: '2022-01-15', status: 'Aktif' },
    { no_anggota: 'A002', nama: 'Citra Lestari', nik: '3201012345670002', alamat: 'Jl. Pahlawan No. 5', no_telepon: '081234567891', tanggal_bergabung: '2022-03-20', status: 'Aktif' },
    { no_anggota: 'A003', nama: 'Doni Firmansyah', nik: '3201012345670003', alamat: 'Jl. Kemerdekaan No. 12', no_telepon: '081234567892', tanggal_bergabung: '2023-05-10', status: 'Tidak Aktif' },
];

let isMockDataInitialized = false;

const initializeMockData = async () => {
    if (isMockDataInitialized) return;
    try {
        const snapshot = await getDocs(anggotaCollectionRef);
        if (snapshot.empty) {
            console.log("Firestore is empty, initializing with mock data.");
            for (const anggota of mockAnggota) {
                await addDoc(anggotaCollectionRef, anggota);
            }
        }
    } catch (e) {
        console.error("Error initializing mock data: ", e);
    } finally {
        isMockDataInitialized = true;
    }
};

export const getAnggota = async (): Promise<Anggota[]> => {
    await initializeMockData();
    const data = await getDocs(anggotaCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as Anggota));
};

export const addAnggota = async (anggota: Omit<Anggota, 'id'>): Promise<Anggota> => {
    const docRef = await addDoc(anggotaCollectionRef, anggota);
    return { ...anggota, id: docRef.id };
};

export const updateAnggota = async (anggota: Anggota): Promise<Anggota> => {
    const anggotaDoc = doc(db, "anggota", anggota.id);
    const { id, ...data } = anggota;
    await updateDoc(anggotaDoc, data as any);
    return anggota;
};

export const deleteAnggota = async (id: string): Promise<void> => {
    const anggotaDoc = doc(db, "anggota", id);
    await deleteDoc(anggotaDoc);
};
