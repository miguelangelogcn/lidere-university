
'use server';

import { db } from '@/lib/firebase';
import type { Account, SerializableAccount } from '@/lib/types';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, type DocumentData, orderBy, query, where, Timestamp, writeBatch, getDoc } from 'firebase/firestore';
import { addWeeks, addMonths, addYears, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const getCollection = (type: 'payable' | 'receivable') => {
    return collection(db, type === 'payable' ? 'contas-a-pagar' : 'contas-a-receber');
};

function docToSerializableAccount(doc: DocumentData): SerializableAccount {
    const data = doc.data() as Account;
    return {
        id: doc.id,
        description: data.description,
        amount: data.amount,
        companyId: data.companyId,
        companyName: data.companyName,
        status: data.status,
        category: data.category,
        isRecurring: data.isRecurring,
        recurrenceId: data.recurrenceId,
        notes: data.notes,
        creditCardId: data.creditCardId,
        creditCardName: data.creditCardName,
        taxRate: data.taxRate,
        dueDate: (data.dueDate as Timestamp).toDate().toISOString(),
        expectedPaymentDate: data.expectedPaymentDate ? (data.expectedPaymentDate as Timestamp).toDate().toISOString() : null,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate().toISOString() : undefined,
        recurrence: data.recurrence ? {
            frequency: data.recurrence.frequency,
            endDate: data.recurrence.endDate ? (data.recurrence.endDate as Timestamp).toDate().toISOString() : undefined,
        } : undefined,
    };
}

export async function getAccounts(type: 'payable' | 'receivable', companyId?: string | null): Promise<SerializableAccount[]> {
    try {
        const coll = getCollection(type);
        const constraints = [orderBy('dueDate', 'asc')];
        if (companyId) {
            constraints.unshift(where('companyId', '==', companyId));
        }
        const q = query(coll, ...constraints);
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs.map(docToSerializableAccount);
    } catch (error) {
        console.error(`Error fetching accounts for ${type}: `, error);
        throw new Error("Falha ao buscar contas.");
    }
}

export async function getPaidReceivablesForPeriod(companyId: string, startDate: Date, endDate: Date): Promise<SerializableAccount[]> {
    try {
        const coll = getCollection('receivable');
        const q = query(coll, where('companyId', '==', companyId), where('status', '==', 'paid'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        
        const filtered = snapshot.docs.filter(doc => {
            const data = doc.data();
            const paidAt = data.paidAt ? (data.paidAt as Timestamp).toDate() : null;
            return paidAt && paidAt >= startDate && paidAt <= endDate;
        });

        return filtered.map(docToSerializableAccount);
    } catch (error) {
        console.error(`Error fetching paid receivables: `, error);
        throw new Error("Falha ao buscar recebíveis pagos.");
    }
}

async function calculateTaxForCompanyPeriod(companyId: string, year: number, month: number): Promise<number> {
    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(new Date(year, month - 1, 1));

    const paidReceivables = await getPaidReceivablesForPeriod(companyId, startDate, endDate);

    if (paidReceivables.length === 0) {
        return 0;
    }

    const totalTax = paidReceivables.reduce((acc, r) => {
        const tax = r.taxRate ? (r.amount * r.taxRate) / 100 : 0;
        return acc + tax;
    }, 0);

    return totalTax;
}

export async function createAccount(type: 'payable' | 'receivable', data: Partial<Account> & { isCalculatedTax?: boolean }, isSeries: boolean): Promise<string> {
    const coll = getCollection(type);
    const batch = writeBatch(db);
    
    const { isCalculatedTax, ...accountDataRest } = data;
    
    if (isSeries && data.isRecurring && data.recurrence?.frequency) {
        const recurrenceId = doc(collection(db, 'random')).id;
        let currentDate = new Date(data.dueDate as any);
        const endDate = data.recurrence.endDate ? new Date(data.recurrence.endDate as any) : addYears(currentDate, 5);

        while (currentDate <= endDate) {
            let finalAmount = data.amount;

            if (isCalculatedTax) {
                const calculationDate = subMonths(currentDate, 1);
                const year = calculationDate.getFullYear();
                const month = calculationDate.getMonth() + 1;
                finalAmount = await calculateTaxForCompanyPeriod(data.companyId!, year, month);
            }
            
            if (finalAmount && finalAmount > 0) {
                const newDocRef = doc(coll);
                const accountData: any = {
                    ...accountDataRest,
                    amount: finalAmount,
                    category: isCalculatedTax ? 'Impostos e Taxas' : data.category,
                    status: 'pending',
                    paidAt: null,
                    recurrenceId: recurrenceId,
                    dueDate: Timestamp.fromDate(currentDate),
                    expectedPaymentDate: data.expectedPaymentDate ? Timestamp.fromDate(new Date(data.expectedPaymentDate as any)) : null,
                    createdAt: Timestamp.now(),
                };
                if(accountData.recurrence?.endDate) {
                    accountData.recurrence.endDate = Timestamp.fromDate(new Date(accountData.recurrence.endDate as any));
                }
                batch.set(newDocRef, accountData);
            }

            switch (data.recurrence.frequency) {
                case 'weekly': currentDate = addWeeks(currentDate, 1); break;
                case 'bi-weekly': currentDate = addWeeks(currentDate, 2); break;
                case 'monthly': currentDate = addMonths(currentDate, 1); break;
                case 'quarterly': currentDate = addMonths(currentDate, 3); break;
                case 'semiannually': currentDate = addMonths(currentDate, 6); break;
                case 'yearly': currentDate = addYears(currentDate, 1); break;
            }
        }
        await batch.commit();
        return recurrenceId;
    } else {
        let finalAmount = data.amount;
        if (isCalculatedTax) {
             const calculationDate = subMonths(new Date(data.dueDate as any), 1);
             const year = calculationDate.getFullYear();
             const month = calculationDate.getMonth() + 1;
             finalAmount = await calculateTaxForCompanyPeriod(data.companyId!, year, month);
        }

        if (!finalAmount || finalAmount <= 0) {
            if (isCalculatedTax) {
                console.log("Tax amount is zero or less, not creating account.");
                return ''; // Don't create if there's no tax to pay
            }
            throw new Error("O valor da conta deve ser positivo.");
        }

        const newDocRef = doc(coll);
        const accountData: any = {
            ...accountDataRest,
            amount: finalAmount,
            category: isCalculatedTax ? 'Impostos e Taxas' : data.category,
            status: 'pending',
            paidAt: null,
            createdAt: Timestamp.now(),
            dueDate: Timestamp.fromDate(new Date(data.dueDate as any)),
            expectedPaymentDate: data.expectedPaymentDate ? Timestamp.fromDate(new Date(data.expectedPaymentDate as any)) : null,
        };
        
        if (data.isRecurring && data.recurrence?.endDate) {
            accountData.recurrence.endDate = Timestamp.fromDate(new Date(data.recurrence.endDate as any));
        }

        batch.set(newDocRef, accountData);
        await batch.commit();
        return newDocRef.id;
    }
}


export async function updateAccount(type: 'payable' | 'receivable', id: string, data: Partial<Omit<Account, 'id' | 'status' | 'paidAt'>>, scope: 'single' | 'future' = 'single'): Promise<void> {
    const coll = getCollection(type);
    const docRef = doc(coll, id);

    const prepareDataForFirebase = (dataToPrepare: Partial<Omit<Account, 'id'>>) => {
        const prepared: any = { ...dataToPrepare };
        if (dataToPrepare.dueDate) prepared.dueDate = Timestamp.fromDate(new Date(dataToPrepare.dueDate));
        if (dataToPrepare.recurrence?.endDate) prepared.recurrence.endDate = Timestamp.fromDate(new Date(dataToPrepare.recurrence.endDate));
        prepared.expectedPaymentDate = dataToPrepare.expectedPaymentDate ? Timestamp.fromDate(new Date(dataToPrepare.expectedPaymentDate)) : null;
        return prepared;
    };
    
    const batch = writeBatch(db);

    if (scope === 'single') {
        const preparedData = prepareDataForFirebase(data);
        batch.update(docRef, preparedData);
        await batch.commit();
        return;
    }

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Conta não encontrada.");

    const currentAccount = docSnap.data() as Account;
    const { recurrenceId, dueDate: currentDueDate } = currentAccount;

    if (!recurrenceId) {
        // Fallback to single update if something is wrong
        await updateAccount(type, id, data, 'single');
        return;
    }

    const q = query(coll, where('recurrenceId', '==', recurrenceId), where('dueDate', '>=', currentDueDate));
    const snapshot = await getDocs(q);

    const { dueDate, ...futureUpdates } = data; // Don't mass-update dueDate
    const preparedFutureUpdates = prepareDataForFirebase(futureUpdates);
    
    snapshot.docs.forEach(docToUpdate => {
        batch.update(docToUpdate.ref, preparedFutureUpdates);
    });
    
    // Ensure the current doc's due date can be updated independently if provided
    if (dueDate) {
        batch.update(docRef, { dueDate: Timestamp.fromDate(new Date(dueDate)) });
    }

    await batch.commit();
}


export async function deleteAccount(type: 'payable' | 'receivable', id: string, scope: 'single' | 'future' = 'single'): Promise<void> {
    const coll = getCollection(type);
    const docRef = doc(coll, id);

    if (scope === 'single') {
        await deleteDoc(docRef);
        return;
    }
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const currentAccount = docSnap.data() as Account;
    const { recurrenceId, dueDate: currentDueDate } = currentAccount;

    if (!recurrenceId) {
        await deleteDoc(docRef);
        return;
    }

    // Query only by recurrenceId to avoid needing a composite index.
    const q = query(coll, where('recurrenceId', '==', recurrenceId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        // Fallback: if no recurring docs are found, just delete the single one.
        await deleteDoc(docRef);
        return;
    }

    const batch = writeBatch(db);
    const comparisonDate = (currentDueDate as Timestamp).toDate();

    snapshot.docs.forEach(docToDelete => {
        const accountData = docToDelete.data() as Account;
        const accountDueDate = (accountData.dueDate as Timestamp).toDate();

        // Filter by date in code
        if (accountDueDate >= comparisonDate) {
            batch.delete(docToDelete.ref);
        }
    });

    await batch.commit();
}
