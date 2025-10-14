
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, writeBatch, getDocsFromServer } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Anggota } from "../types";

const anggotaCollectionRef = collection(db, "anggota");

const mockAnggota: Omit<Anggota, 'id'>[] = [
    { name: 'Budi Santoso', email: 'budi.s@mail.com', joinDate: '2022-01-15', phone: '081234567890', address: 'Jl. Merdeka No. 17, Jakarta', totalSimpanan: 15000000, totalPinjaman: 5000000 },
    { name: 'Siti Aminah', email: 'siti.a@mail.com', joinDate: '2022-02-20', phone: '081298765432', address: 'Jl. Pahlawan No. 10, Bandung', totalSimpanan: 12500000, totalPinjaman: 2000000 },
    { name: 'Ahmad Dahlan', email: 'ahmad.d@mail.com', joinDate: '2022-03-10', phone: '081211223344', address: 'Jl. Sudirman No. 5, Surabaya', totalSimpanan: 25000000, totalPinjaman: 10000000 },
];

const seedData = async () => {
    const q = query(anggotaCollectionRef);
    const snapshot = await getDocsFromServer(q);
    if (snapshot.empty) {
        console.log("No data found, seeding mock data...");
        const batch = writeBatch(db);
        mockAnggota.forEach(anggota => {
            const docRef = doc(anggotaCollectionRef);
            batch.set(docRef, anggota);
        });
        await batch.commit();
        console.log("Mock data seeded.");
    }
};

let isSeeded = false;

export const getAnggota = async (): Promise<Anggota[]> => {
    if(!isSeeded){
        try {
            await seedData();
        } catch (error) {
            console.error("Firebase seeding failed. This might be due to incorrect firebaseConfig.ts setup or security rules. Falling back to local mock.", error);
            // Fallback to mock data if seeding fails
            return mockAnggota.map((a, i) => ({...a, id: `mock-${i}`}));
        }
        isSeeded = true;
    }
    const data = await getDocs(anggotaCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Anggota[];
};

export const addAnggota = async (anggota: Omit<Anggota, 'id'>): Promise<Anggota> => {
    const docRef = await addDoc(anggotaCollectionRef, anggota);
    return { ...anggota, id: docRef.id };
};

export const updateAnggota = async (anggota: Anggota): Promise<Anggota> => {
    const anggotaData = { ...anggota };
    delete (anggotaData as any).id; // Firestore update doesn't need id in payload
    const anggotaDoc = doc(db, "anggota", anggota.id);
    await updateDoc(anggotaDoc, anggotaData);
    return anggota;
};

export const deleteAnggota = async (id: string): Promise<void> => {
    const anggotaDoc = doc(db, "anggota", id);
    await deleteDoc(anggotaDoc);
};
