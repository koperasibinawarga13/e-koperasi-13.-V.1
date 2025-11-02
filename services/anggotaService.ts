// FIX: Implemented full content for anggotaService.ts to handle Firestore operations.
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch, getDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Anggota, Keuangan } from '../types';

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

export const getAnggotaByNo = async (no_anggota: string): Promise<Anggota | null> => {
    try {
        if (!no_anggota) return null;
        const q = query(anggotaCollectionRef, where("no_anggota", "==", no_anggota.toUpperCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { ...doc.data(), id: doc.id } as Anggota;
        }
        return null;
    } catch (error) {
        console.error("Error finding anggota by no_anggota: ", error);
        return null;
    }
};


export const findAnggotaByCredentials = async (no_anggota: string, password: string): Promise<Anggota | null> => {
    try {
        const q = query(anggotaCollectionRef, where("no_anggota", "==", no_anggota.toUpperCase()), where("password", "==", password));
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

export const batchUpsertAnggota = async (anggotaList: NewAnggotaFromUpload[]): Promise<void> => {
    try {
        const allAnggota = await getAnggota();
        const anggotaMap = new Map(allAnggota.map(a => [a.no_anggota.toUpperCase(), a]));
        
        const batch = writeBatch(db);

        anggotaList.forEach((newAnggota) => {
            const existingAnggota = anggotaMap.get(newAnggota.no_anggota);
            
            if (existingAnggota) {
                // Update existing member
                const docRef = doc(db, 'anggota', existingAnggota.id);
                batch.update(docRef, {
                    nama: newAnggota.nama,
                    no_telepon: newAnggota.no_telepon,
                    no_anggota: newAnggota.no_anggota // Enforce uppercase
                });
            } else {
                // Add new member
                const docRef = doc(anggotaCollectionRef); // Auto-generate ID
                const fullAnggotaData: Omit<Anggota, 'id'> = {
                    ...newAnggota,
                    password: '',
                    nik: '',
                    alamat: '',
                    email: '',
                    tanggal_bergabung: new Date().toISOString().split('T')[0],
                    status: 'Aktif',
                };
                batch.set(docRef, fullAnggotaData);
            }
        });

        await batch.commit();
    } catch (error) {
        console.error("Error in batch upsert for anggota: ", error);
        throw error;
    }
}

export const registerAnggota = async (no_anggota: string, no_telepon: string, password: string): Promise<void> => {
    try {
        const q = query(anggotaCollectionRef, where("no_anggota", "==", no_anggota.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Nomor anggota tidak ditemukan.");
        }

        const anggotaDocument = querySnapshot.docs[0];
        const anggotaData = anggotaDocument.data() as Anggota;

        // Check if password is not an empty string, meaning it's already set
        if (anggotaData.password) {
            throw new Error("Akun ini sudah terdaftar. Silakan login.");
        }

        if (anggotaData.no_telepon !== no_telepon) {
            throw new Error("Nomor HP tidak sesuai dengan data kami.");
        }
        
        // If validation passes, update the document with the new password
        const anggotaDoc = doc(db, 'anggota', anggotaDocument.id);
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

export const deleteAllAnggota = async (): Promise<void> => {
    try {
        const querySnapshot = await getDocs(anggotaCollectionRef);
        if (querySnapshot.empty) {
            return; // Nothing to delete
        }

        const docs = querySnapshot.docs;
        const batchArray = [];
        // Firestore allows up to 500 operations in a single batch.
        for (let i = 0; i < docs.length; i += 500) {
            const batch = writeBatch(db);
            const chunk = docs.slice(i, i + 500);
            chunk.forEach(doc => batch.delete(doc.ref));
            batchArray.push(batch.commit());
        }

        await Promise.all(batchArray);

    } catch (error) {
        console.error("Error deleting all anggota: ", error);
        throw new Error("Gagal menghapus semua anggota.");
    }
};

export const migrateAnggotaStatus = async (anggota: Anggota, newNoAnggota: string): Promise<void> => {
    const oldNoAnggota = anggota.no_anggota;

    try {
        const batch = writeBatch(db);

        // 1. Update Anggota Document
        const anggotaDocRef = doc(db, 'anggota', anggota.id);
        batch.update(anggotaDocRef, { no_anggota: newNoAnggota });

        // 2. Migrate Keuangan Main Document
        const oldKeuanganDocRef = doc(db, 'keuangan', oldNoAnggota);
        const oldKeuanganDocSnap = await getDoc(oldKeuanganDocRef);
        if (oldKeuanganDocSnap.exists()) {
            const keuanganData = oldKeuanganDocSnap.data();
            keuanganData.no_anggota = newNoAnggota;
            keuanganData.nama_angota = anggota.nama; // Ensure name is up-to-date
            const newKeuanganDocRef = doc(db, 'keuangan', newNoAnggota);
            batch.set(newKeuanganDocRef, keuanganData);
            batch.delete(oldKeuanganDocRef);
        }

        // 3. Migrate Keuangan History Subcollection
        const oldHistoryCollectionRef = collection(db, 'keuangan', oldNoAnggota, 'history');
        const historySnapshot = await getDocs(oldHistoryCollectionRef);
        if (!historySnapshot.empty) {
            historySnapshot.forEach(historyDoc => {
                const historyData = historyDoc.data();
                historyData.no_anggota = newNoAnggota;
                const newHistoryDocRef = doc(db, 'keuangan', newNoAnggota, 'history', historyDoc.id);
                batch.set(newHistoryDocRef, historyData);
                batch.delete(historyDoc.ref);
            });
        }
        
        // 4. Update Pengajuan Pinjaman Documents
        const pinjamanQuery = query(collection(db, 'pengajuan_pinjaman'), where("no_anggota", "==", oldNoAnggota));
        const pinjamanSnapshot = await getDocs(pinjamanQuery);
        if (!pinjamanSnapshot.empty) {
            pinjamanSnapshot.forEach(pinjamanDoc => {
                batch.update(pinjamanDoc.ref, { no_anggota: newNoAnggota });
            });
        }

        // Commit all changes at once
        await batch.commit();

    } catch (error) {
        console.error("Error migrating anggota status:", error);
        throw new Error("Gagal memigrasikan data anggota. Silakan coba lagi.");
    }
};


export const generateNewAnggotaNo = async (prefix: 'AK' | 'PB' | 'WL'): Promise<string> => {
    try {
        // Query for the last member with the given prefix, sorted by no_anggota descending.
        // This relies on Firestore's lexicographical sorting. 'WL-99' comes after 'WL-100' so we must handle this on client.
        const q = query(anggotaCollectionRef, where('no_anggota', '>=', `${prefix}-`), where('no_anggota', '<', `${prefix}-~`));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return `${prefix}-101`; // Start numbering from 101 if no members exist
        }

        const numbers = snapshot.docs
            .map(doc => parseInt(doc.data().no_anggota.split('-')[1], 10))
            .filter(n => !isNaN(n));

        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 100;
        return `${prefix}-${maxNumber + 1}`;

    } catch (error) {
        console.error("Error generating new member number: ", error);
        throw new Error("Gagal membuat nomor anggota baru.");
    }
};

interface NewMemberRegistrationData {
    nama: string;
    alamat: string;
    no_anggota: string;
    password: string;
}

export const registerNewAnggota = async (data: NewMemberRegistrationData): Promise<void> => {
    try {
        // Ensure the generated no_anggota is not already taken
        const existingAnggota = await getAnggotaByNo(data.no_anggota);
        if (existingAnggota) {
            throw new Error(`Nomor anggota ${data.no_anggota} sudah digunakan. Mohon coba lagi.`);
        }

        const batch = writeBatch(db);

        // 1. Create Anggota document
        const newAnggotaDocRef = doc(anggotaCollectionRef);
        const newAnggota: Omit<Anggota, 'id'> = {
            no_anggota: data.no_anggota,
            nama: data.nama,
            alamat: data.alamat,
            password: data.password,
            status: 'Aktif',
            tanggal_bergabung: new Date().toISOString().split('T')[0],
            email: '',
            nik: '',
            no_telepon: ''
        };
        batch.set(newAnggotaDocRef, newAnggota);

        // 2. Create initial Keuangan document with zeroed values
        const newKeuanganDocRef = doc(db, 'keuangan', data.no_anggota);
        const initialKeuangan: Omit<Keuangan, 'id'> = {
            no: 0,
            no_anggota: data.no_anggota,
            nama_angota: data.nama,
            awal_simpanan_pokok: 0, awal_simpanan_wajib: 0, sukarela: 0, awal_simpanan_wisata: 0, awal_pinjaman_berjangka: 0, awal_pinjaman_khusus: 0,
            transaksi_simpanan_pokok: 0, transaksi_simpanan_wajib: 0, transaksi_simpanan_sukarela: 0, transaksi_simpanan_wisata: 0, transaksi_pinjaman_berjangka: 0, transaksi_pinjaman_khusus: 0,
            transaksi_simpanan_jasa: 0, transaksi_niaga: 0, transaksi_dana_perlaya: 0, transaksi_dana_katineng: 0, Jumlah_setoran: 0,
            transaksi_pengambilan_simpanan_pokok: 0, transaksi_pengambilan_simpanan_wajib: 0, transaksi_pengambilan_simpanan_sukarela: 0, transaksi_pengambilan_simpanan_wisata: 0,
            transaksi_penambahan_pinjaman_berjangka: 0, transaksi_penambahan_pinjaman_khusus: 0, transaksi_penambahan_pinjaman_niaga: 0,
            akhir_simpanan_pokok: 0, akhir_simpanan_wajib: 0, akhir_simpanan_sukarela: 0, akhir_simpanan_wisata: 0, akhir_pinjaman_berjangka: 0, akhir_pinjaman_khusus: 0,
            jumlah_total_simpanan: 0, jumlah_total_pinjaman: 0,
        };
        batch.set(newKeuanganDocRef, initialKeuangan);

        await batch.commit();

    } catch (error) {
        console.error("Error during new member registration:", error);
        throw error;
    }
};