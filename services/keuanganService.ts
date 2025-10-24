import { collection, doc, writeBatch, runTransaction, getDocs, getDoc, updateDoc, arrayRemove, deleteDoc, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Keuangan, TransaksiBulanan, TransaksiLog } from '../types';
import { getLogById } from './transaksiLogService';


const keuanganCollectionRef = collection(db, 'keuangan');

export const getKeuangan = async (): Promise<Keuangan[]> => {
    try {
        const data = await getDocs(keuanganCollectionRef);
        return data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Keuangan));
    } catch (error) {
        console.error("Error fetching financial data: ", error);
        return [];
    }
};

export const getKeuanganByNoAnggota = async (no_anggota: string): Promise<Keuangan | null> => {
    try {
        const docRef = doc(db, 'keuangan', no_anggota);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Keuangan;
        }
        console.warn(`No financial data found for no_anggota: ${no_anggota}`);
        return null;
    } catch (error) {
        console.error(`Error fetching financial data for ${no_anggota}: `, error);
        return null;
    }
}

export const getLaporanBulanan = async (no_anggota: string, month: string): Promise<Keuangan | null> => {
    try {
        const docRef = doc(db, 'keuangan', no_anggota, 'history', month);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Keuangan;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching monthly report for ${no_anggota}, month ${month}:`, error);
        return null;
    }
};

export const getAvailableLaporanMonths = async (no_anggota: string): Promise<string[]> => {
    try {
        const historyCollectionRef = collection(db, 'keuangan', no_anggota, 'history');
        // Fetch docs without ordering to avoid index requirement
        const snapshot = await getDocs(historyCollectionRef);
        const months = snapshot.docs.map(doc => doc.id); // doc.id is 'YYYY-MM'
        
        // Sort on the client-side in descending order
        months.sort((a, b) => b.localeCompare(a));
        
        return months;
    } catch (error) {
        console.error(`Error fetching available months for ${no_anggota}:`, error);
        return [];
    }
};

// Menggunakan no_anggota sebagai ID dokumen untuk operasi upsert (update/insert) yang efisien.
export const batchUpsertKeuangan = async (keuanganList: Keuangan[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        keuanganList.forEach((data) => {
            if (data.no_anggota) {
                // ID Dokumen akan sama dengan nomor anggota
                const docRef = doc(db, 'keuangan', data.no_anggota);
                batch.set(docRef, data);
            }
        });
        await batch.commit();
    } catch (error) {
        console.error("Error upserting financial data in batch: ", error);
        throw error;
    }
};

const getPreviousMonth = (month: string): string | null => {
    const [year, m] = month.split('-').map(Number);
    if (isNaN(year) || isNaN(m)) return null;
    const date = new Date(year, m - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const prevYear = date.getFullYear();
    const prevMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${prevYear}-${prevMonth}`;
};

const transactionFields: (keyof TransaksiBulanan)[] = [
    'transaksi_simpanan_pokok', 'transaksi_simpanan_wajib', 'transaksi_simpanan_sukarela', 'transaksi_simpanan_wisata',
    'transaksi_pinjaman_berjangka', 'transaksi_pinjaman_khusus', 'transaksi_simpanan_jasa', 'transaksi_niaga',
    'transaksi_dana_perlaya', 'transaksi_dana_katineng', 'Jumlah_setoran', 'transaksi_pengambilan_simpanan_pokok',
    'transaksi_pengambilan_simpanan_wajib', 'transaksi_pengambilan_simpanan_sukarela', 'transaksi_pengambilan_simpanan_wisata',
    'transaksi_penambahan_pinjaman_berjangka', 'transaksi_penambahan_pinjaman_khusus', 'transaksi_penambahan_pinjaman_niaga'
];


export const batchProcessTransaksiBulanan = async (transaksiList: TransaksiBulanan[], month: string): Promise<{successCount: number, errorCount: number, errors: any[]}> => {
    let successCount = 0;
    let errorCount = 0;
    const errors: { no_anggota: string; error: string }[] = [];

    if (!/^\d{4}-\d{2}$/.test(month)) {
        errors.push({ no_anggota: 'SYSTEM', error: 'Format bulan tidak valid. Gunakan YYYY-MM.' });
        return { successCount: 0, errorCount: transaksiList.length, errors };
    }
    
    // Pre-fetch all member names to avoid reads inside the transaction loop
    const anggotaCollectionRef = collection(db, 'anggota');
    const allAnggotaSnapshot = await getDocs(anggotaCollectionRef);
    const anggotaMap = new Map<string, string>();
    allAnggotaSnapshot.forEach(doc => {
        const anggotaData = doc.data();
        anggotaMap.set(anggotaData.no_anggota, anggotaData.nama);
    });

    for (const tx of transaksiList) {
        if (!tx.no_anggota) {
            errorCount++;
            errors.push({ no_anggota: 'TIDAK DIKETAHUI', error: 'Kolom no_anggota kosong.' });
            continue;
        }
        
        const mainDocRef = doc(db, 'keuangan', tx.no_anggota);
        const historyDocRef = doc(db, 'keuangan', tx.no_anggota, 'history', month);
        const previousMonth = getPreviousMonth(month);
        const prevMonthHistoryRef = previousMonth ? doc(db, 'keuangan', tx.no_anggota, 'history', previousMonth) : null;


        try {
            await runTransaction(db, async (transaction) => {
                 const [mainSnap, historySnap, prevMonthHistorySnap] = await Promise.all([
                    transaction.get(mainDocRef),
                    transaction.get(historyDocRef),
                    prevMonthHistoryRef ? transaction.get(prevMonthHistoryRef) : Promise.resolve(null)
                ]);
                
                let startOfMonthData: Partial<Keuangan> = {};
                if (prevMonthHistorySnap?.exists()) {
                    const prevData = prevMonthHistorySnap.data() as Keuangan;
                    startOfMonthData = {
                        akhir_simpanan_pokok: prevData.akhir_simpanan_pokok || 0,
                        akhir_simpanan_wajib: prevData.akhir_simpanan_wajib || 0,
                        akhir_simpanan_sukarela: prevData.akhir_simpanan_sukarela || 0,
                        akhir_simpanan_wisata: prevData.akhir_simpanan_wisata || 0,
                        akhir_pinjaman_berjangka: prevData.akhir_pinjaman_berjangka || 0,
                        akhir_pinjaman_khusus: prevData.akhir_pinjaman_khusus || 0,
                    };
                }

                const existingDataForMonth: Partial<Keuangan> = historySnap.exists() ? (historySnap.data() as Keuangan) : {};
                
                const newReport: Keuangan = {
                    no: (mainSnap.data()?.no || 0),
                    no_anggota: tx.no_anggota,
                    nama_angota: tx.nama_angota || anggotaMap.get(tx.no_anggota) || 'Anggota',
                    periode: month,
                    tanggal_transaksi: tx.tanggal_transaksi,
                    admin_nama: tx.admin_nama,
                    
                    awal_simpanan_pokok: startOfMonthData.akhir_simpanan_pokok || 0,
                    awal_simpanan_wajib: startOfMonthData.akhir_simpanan_wajib || 0,
                    sukarela: startOfMonthData.akhir_simpanan_sukarela || 0,
                    awal_simpanan_wisata: startOfMonthData.akhir_simpanan_wisata || 0,
                    awal_pinjaman_berjangka: startOfMonthData.akhir_pinjaman_berjangka || 0,
                    awal_pinjaman_khusus: startOfMonthData.akhir_pinjaman_khusus || 0,
                    
                    ...Object.fromEntries(transactionFields.map(f => [f, 0])) as any // Initialize transaction fields
                };
                
                transactionFields.forEach(field => {
                    (newReport as any)[field] = ((existingDataForMonth as any)[field] || 0) + ((tx as any)[field] || 0);
                });

                // Recalculate "akhir" values
                newReport.akhir_simpanan_pokok = newReport.awal_simpanan_pokok + (newReport.transaksi_simpanan_pokok || 0) - (newReport.transaksi_pengambilan_simpanan_pokok || 0);
                newReport.akhir_simpanan_wajib = newReport.awal_simpanan_wajib + (newReport.transaksi_simpanan_wajib || 0) - (newReport.transaksi_pengambilan_simpanan_wajib || 0);
                newReport.akhir_simpanan_sukarela = newReport.sukarela + (newReport.transaksi_simpanan_sukarela || 0) - (newReport.transaksi_pengambilan_simpanan_sukarela || 0);
                newReport.akhir_simpanan_wisata = newReport.awal_simpanan_wisata + (newReport.transaksi_simpanan_wisata || 0) - (newReport.transaksi_pengambilan_simpanan_wisata || 0);
                
                newReport.akhir_pinjaman_berjangka = newReport.awal_pinjaman_berjangka - (newReport.transaksi_pinjaman_berjangka || 0) + (newReport.transaksi_penambahan_pinjaman_berjangka || 0);
                newReport.akhir_pinjaman_khusus = newReport.awal_pinjaman_khusus - (newReport.transaksi_pinjaman_khusus || 0) + (newReport.transaksi_penambahan_pinjaman_khusus || 0);
                
                // Recalculate totals
                newReport.jumlah_total_simpanan = 
                    (newReport.akhir_simpanan_pokok || 0) + 
                    (newReport.akhir_simpanan_wajib || 0) + 
                    (newReport.akhir_simpanan_sukarela || 0) + 
                    (newReport.akhir_simpanan_wisata || 0);

                newReport.jumlah_total_pinjaman = 
                    (newReport.akhir_pinjaman_berjangka || 0) + 
                    (newReport.akhir_pinjaman_khusus || 0);

                transaction.set(historyDocRef, newReport);
                
                const currentLatestPeriod = mainSnap.exists() ? mainSnap.data().periode : '';
                if (!currentLatestPeriod || month >= currentLatestPeriod) {
                    transaction.set(mainDocRef, newReport);
                }
            });
            successCount++;
        } catch (error) {
            console.error(`Error processing transaction for ${tx.no_anggota}:`, error);
            errorCount++;
            errors.push({ no_anggota: tx.no_anggota, error: (error as Error).message });
        }
    }

    if (errorCount === 0 && successCount > 0) {
        try {
            const summaryDocRef = doc(db, 'upload_summary', 'monthly_transactions');
            await runTransaction(db, async (transaction) => {
                const summaryDoc = await transaction.get(summaryDocRef);
                if (!summaryDoc.exists()) {
                    transaction.set(summaryDocRef, { months: [month] });
                } else {
                    const data = summaryDoc.data();
                    const months = data.months || [];
                    if (!months.includes(month)) {
                        const newMonths = [...months, month];
                        transaction.update(summaryDocRef, { months: newMonths });
                    }
                }
            });
        } catch (e) {
            console.error("Failed to update upload summary:", e);
            errors.push({ no_anggota: 'SYSTEM', error: 'Gagal memperbarui riwayat unggahan.' });
        }
    }
    
    return { successCount, errorCount, errors };
};

export const getUploadedMonths = async (): Promise<string[]> => {
    try {
        const summaryDocRef = doc(db, 'upload_summary', 'monthly_transactions');
        const docSnap = await getDoc(summaryDocRef);
        if (docSnap.exists() && docSnap.data().months) {
            const months = docSnap.data().months as string[];
            months.sort((a, b) => b.localeCompare(a));
            return months;
        }
        return [];
    } catch (error) {
        console.error("Error fetching uploaded months history:", error);
        return [];
    }
};

export const deleteMonthlyReport = async (monthToDelete: string): Promise<void> => {
    const allKeuanganDocs = await getDocs(keuanganCollectionRef);
    const processingPromises: Promise<void>[] = [];

    for (const keuanganDoc of allKeuanganDocs.docs) {
        const no_anggota = keuanganDoc.id;
        const currentData = keuanganDoc.data() as Keuangan;
        
        const promise = runTransaction(db, async (transaction) => {
            const historyCollectionRef = collection(db, 'keuangan', no_anggota, 'history');
            const historyDocToDeleteRef = doc(historyCollectionRef, monthToDelete);
            const historyDocToDeleteSnap = await transaction.get(historyDocToDeleteRef);

            if (historyDocToDeleteSnap.exists()) {
                transaction.delete(historyDocToDeleteRef);
            }

            if (currentData.periode === monthToDelete) {
                const mainDocRef = doc(db, 'keuangan', no_anggota);
                
                const q = query(historyCollectionRef, orderBy('periode', 'desc'));
                const historySnapshot = await getDocs(q);
                
                let previousReportDoc = null;
                for (const doc of historySnapshot.docs) {
                    if (doc.id !== monthToDelete) {
                        previousReportDoc = doc;
                        break;
                    }
                }

                if (previousReportDoc && previousReportDoc.exists()) {
                    transaction.update(mainDocRef, previousReportDoc.data());
                } else {
                    const reportToDeleteData = historyDocToDeleteSnap.exists() ? historyDocToDeleteSnap.data() as Keuangan : currentData;
                    const revertedState: Keuangan = { ...currentData };

                    Object.keys(revertedState).forEach(key => {
                        if (key.startsWith('transaksi_') || key === 'Jumlah_setoran') {
                            (revertedState as any)[key] = 0;
                        }
                    });

                    revertedState.akhir_simpanan_pokok = reportToDeleteData.awal_simpanan_pokok;
                    revertedState.akhir_simpanan_wajib = reportToDeleteData.awal_simpanan_wajib;
                    revertedState.akhir_simpanan_sukarela = reportToDeleteData.sukarela;
                    revertedState.akhir_simpanan_wisata = reportToDeleteData.awal_simpanan_wisata;
                    revertedState.akhir_pinjaman_berjangka = reportToDeleteData.awal_pinjaman_berjangka;
                    revertedState.akhir_pinjaman_khusus = reportToDeleteData.awal_pinjaman_khusus;
                    
                    revertedState.awal_simpanan_pokok = reportToDeleteData.awal_simpanan_pokok;
                    revertedState.awal_simpanan_wajib = reportToDeleteData.awal_simpanan_wajib;
                    revertedState.sukarela = reportToDeleteData.sukarela;
                    revertedState.awal_simpanan_wisata = reportToDeleteData.awal_simpanan_wisata;
                    revertedState.awal_pinjaman_berjangka = reportToDeleteData.awal_pinjaman_berjangka;
                    revertedState.awal_pinjaman_khusus = reportToDeleteData.awal_pinjaman_khusus;

                    revertedState.jumlah_total_simpanan = revertedState.akhir_simpanan_pokok + revertedState.akhir_simpanan_wajib + revertedState.akhir_simpanan_sukarela + revertedState.akhir_simpanan_wisata;
                    revertedState.jumlah_total_pinjaman = revertedState.akhir_pinjaman_berjangka + revertedState.akhir_pinjaman_khusus;
                    delete (revertedState as Partial<Keuangan>).periode;

                    transaction.set(mainDocRef, revertedState);
                }
            }
        });
        processingPromises.push(promise);
    }
    
    await Promise.all(processingPromises);

    const summaryDocRef = doc(db, 'upload_summary', 'monthly_transactions');
    await updateDoc(summaryDocRef, {
        months: arrayRemove(monthToDelete)
    });
};

export const rebuildUploadHistory = async (): Promise<string[]> => {
    try {
        const allKeuanganDocs = await getDocs(keuanganCollectionRef);
        const uniqueMonths = new Set<string>();

        const historyPromises = allKeuanganDocs.docs.map(anggotaDoc => 
            getDocs(collection(db, 'keuangan', anggotaDoc.id, 'history'))
        );

        const allHistorySnapshots = await Promise.all(historyPromises);

        allHistorySnapshots.forEach(historySnapshot => {
            historySnapshot.forEach(doc => {
                uniqueMonths.add(doc.id); // doc.id is 'YYYY-MM'
            });
        });

        const sortedMonths = Array.from(uniqueMonths).sort((a, b) => b.localeCompare(a));
        
        const summaryDocRef = doc(db, 'upload_summary', 'monthly_transactions');
        await setDoc(summaryDocRef, { months: sortedMonths });
        
        return sortedMonths;
    } catch (error) {
        console.error("Error rebuilding upload history:", error);
        throw error;
    }
};

const calculateEndBalances = (report: Keuangan): Keuangan => {
    const updatedReport = { ...report };
    updatedReport.akhir_simpanan_pokok = updatedReport.awal_simpanan_pokok + (updatedReport.transaksi_simpanan_pokok || 0) - (updatedReport.transaksi_pengambilan_simpanan_pokok || 0);
    updatedReport.akhir_simpanan_wajib = updatedReport.awal_simpanan_wajib + (updatedReport.transaksi_simpanan_wajib || 0) - (updatedReport.transaksi_pengambilan_simpanan_wajib || 0);
    updatedReport.akhir_simpanan_sukarela = updatedReport.sukarela + (updatedReport.transaksi_simpanan_sukarela || 0) - (updatedReport.transaksi_pengambilan_simpanan_sukarela || 0);
    updatedReport.akhir_simpanan_wisata = updatedReport.awal_simpanan_wisata + (updatedReport.transaksi_simpanan_wisata || 0) - (updatedReport.transaksi_pengambilan_simpanan_wisata || 0);
    updatedReport.akhir_pinjaman_berjangka = updatedReport.awal_pinjaman_berjangka - (updatedReport.transaksi_pinjaman_berjangka || 0) + (updatedReport.transaksi_penambahan_pinjaman_berjangka || 0);
    updatedReport.akhir_pinjaman_khusus = updatedReport.awal_pinjaman_khusus - (updatedReport.transaksi_pinjaman_khusus || 0) + (updatedReport.transaksi_penambahan_pinjaman_khusus || 0);
    updatedReport.jumlah_total_simpanan = updatedReport.akhir_simpanan_pokok + updatedReport.akhir_simpanan_wajib + updatedReport.akhir_simpanan_sukarela + updatedReport.akhir_simpanan_wisata;
    updatedReport.jumlah_total_pinjaman = updatedReport.akhir_pinjaman_berjangka + updatedReport.akhir_pinjaman_khusus;
    return updatedReport;
};


export const correctPastTransaction = async (logId: string, updatedTxData: TransaksiBulanan, editorName: string): Promise<void> => {
    const originalLog = await getLogById(logId);
    if (!originalLog) {
        throw new Error("Log transaksi asli tidak ditemukan.");
    }

    const { no_anggota, periode } = originalLog;

    await runTransaction(db, async (transaction) => {
        // 1. Calculate deltas (new - old)
        const deltas: { [key: string]: number } = {};
        transactionFields.forEach(field => {
            const oldValue = (originalLog as any)[field] || 0;
            const newValue = (updatedTxData as any)[field] || 0;
            if (oldValue !== newValue) {
                deltas[field] = newValue - oldValue;
            }
        });

        if (Object.keys(deltas).length === 0) {
            // No changes, but we still update the log metadata
            const logDocRef = doc(db, 'transaksi_logs', logId);
            transaction.update(logDocRef, {
                ...updatedTxData,
                editedAt: new Date().toISOString(),
                editedBy: editorName,
            });
            return;
        }

        // 2. Fetch all subsequent history reports for this member
        const allMonths = await getAvailableLaporanMonths(no_anggota);
        const subsequentMonths = allMonths.filter(m => m >= periode).sort((a, b) => a.localeCompare(b));

        let previousMonthEndBalances: Partial<Keuangan> | null = null;

        // 3. Recalculate each month sequentially
        for (const month of subsequentMonths) {
            const historyDocRef = doc(db, 'keuangan', no_anggota, 'history', month);
            const historySnap = await transaction.get(historyDocRef);
            
            if (!historySnap.exists()) continue; // Should not happen in a consistent dataset

            let currentMonthReport = historySnap.data() as Keuangan;

            // Apply deltas to the target month
            if (month === periode) {
                Object.entries(deltas).forEach(([field, delta]) => {
                    (currentMonthReport as any)[field] = ((currentMonthReport as any)[field] || 0) + delta;
                });
            }

            // Update starting balances from previous month's recalculated end balances
            if (previousMonthEndBalances) {
                currentMonthReport.awal_simpanan_pokok = previousMonthEndBalances.akhir_simpanan_pokok || 0;
                currentMonthReport.awal_simpanan_wajib = previousMonthEndBalances.akhir_simpanan_wajib || 0;
                currentMonthReport.sukarela = previousMonthEndBalances.akhir_simpanan_sukarela || 0;
                currentMonthReport.awal_simpanan_wisata = previousMonthEndBalances.akhir_simpanan_wisata || 0;
                currentMonthReport.awal_pinjaman_berjangka = previousMonthEndBalances.akhir_pinjaman_berjangka || 0;
                currentMonthReport.awal_pinjaman_khusus = previousMonthEndBalances.akhir_pinjaman_khusus || 0;
            }
            
            // Recalculate end balances for the current month
            const recalculatedReport = calculateEndBalances(currentMonthReport);
            
            // Save the updated report for this month
            transaction.set(historyDocRef, recalculatedReport);

            // Store its end balances for the next iteration
            previousMonthEndBalances = recalculatedReport;
        }

        // 4. Update the main 'keuangan' document if we processed any month
        if (previousMonthEndBalances) {
            const mainDocRef = doc(db, 'keuangan', no_anggota);
            transaction.set(mainDocRef, previousMonthEndBalances);
        }

        // 5. Update the transaction log itself
        const logDocRef = doc(db, 'transaksi_logs', logId);
        transaction.update(logDocRef, {
            ...updatedTxData,
            type: 'EDIT',
            editedAt: new Date().toISOString(),
            editedBy: editorName,
        });
    });
};