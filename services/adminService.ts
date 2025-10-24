import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AdminUser } from '../types';

const adminCollectionRef = collection(db, 'admins');

export const getAdmins = async (): Promise<AdminUser[]> => {
    try {
        const data = await getDocs(adminCollectionRef);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as AdminUser));
    } catch (error) {
        console.error("Error fetching admins: ", error);
        return [];
    }
};

export const getAdminById = async (id: string): Promise<AdminUser | null> => {
    try {
        const docRef = doc(db, 'admins', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as AdminUser;
        }
        return null;
    } catch (error) {
        console.error("Error fetching admin by ID: ", error);
        return null;
    }
};

export const findAdminByCredentials = async (email: string, password: string): Promise<AdminUser | null> => {
    try {
        // First, check for the hardcoded super admin for backward compatibility and initial setup
        if (email === 'admin@koperasi13.com' && password === 'admin123') {
            // Check if this admin exists in the collection, if not, create it.
            const q = query(adminCollectionRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                const superAdmin: Omit<AdminUser, 'id'> = {
                    nama: 'Admin Utama',
                    email: 'admin@koperasi13.com',
                    password: 'admin123',
                    role: 'admin'
                };
                const docRef = await addDoc(adminCollectionRef, superAdmin);
                return { ...superAdmin, id: docRef.id };
            } else {
                 const adminDoc = querySnapshot.docs[0];
                 // Security check: ensure password matches
                 if (adminDoc.data().password === password) {
                    return { ...adminDoc.data(), id: adminDoc.id } as AdminUser;
                 }
                 return null; // Password mismatch
            }
        }
        
        // Then, check the collection for other admins
        const q = query(adminCollectionRef, where("email", "==", email), where("password", "==", password));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { ...doc.data(), id: doc.id } as AdminUser;
        }
        return null;
    } catch (error) {
        console.error("Error finding admin by credentials: ", error);
        return null;
    }
};


export const addAdmin = async (newAdmin: Omit<AdminUser, 'id'>): Promise<AdminUser> => {
    try {
        const docRef = await addDoc(adminCollectionRef, newAdmin);
        return { ...newAdmin, id: docRef.id };
    } catch (error) {
        console.error("Error adding admin: ", error);
        throw error;
    }
};

export const updateAdmin = async (updatedAdmin: AdminUser): Promise<AdminUser> => {
    try {
        const adminDoc = doc(db, 'admins', updatedAdmin.id);
        const { id, ...dataToUpdate } = updatedAdmin;
        await updateDoc(adminDoc, dataToUpdate);
        return updatedAdmin;
    } catch (error) {
        console.error("Error updating admin: ", error);
        throw error;
    }
};

export const deleteAdmin = async (id: string): Promise<void> => {
    try {
        const adminDoc = doc(db, 'admins', id);
        await deleteDoc(adminDoc);
    } catch (error) {
        console.error("Error deleting admin: ", error);
        throw error;
    }
};