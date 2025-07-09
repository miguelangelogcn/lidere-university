
'use server';

import { db } from '@/lib/firebase';
import type { Account, SerializableAccount } from '@/lib/types';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, type DocumentData, orderBy, query, where, Timestamp, writeBatch, getDoc } from 'firebase/firestore';
import { addWeeks, addMonths, addYears } from 'date-fns';

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

const createFinancialRecordInBatch = (batch: ReturnType<typeof writeBatch>, type: 'payable' | 'receivable', accountData: Partial<Account>) => {
    if (!accountData.paidAt) return; // Should not happen if status is paid
    const financialRecordRef = doc(collection(db, 'fin-registros'));
    const financialRecordData = {
        description: `${type === 'payable' ? 'Pagamento' : 'Recebimento'} de conta: ${accountData.description}`,
        amount: accountData.amount,
        type: type === 'payable' ? 'expense' : 'income',
        date: new Date(accountData.paidAt as any),
        category: accountData.category,
        companyId: accountData.companyId,
        companyName: accountData.companyName,
        createdAt: new Date(),
    };
    batch.set(financialRecordRef, financialRecordData);
};


export async function createAccount(type: 'payable' | 'receivable', data: Partial<Account>, isSeries: boolean): Promise<string> {
    const coll = getCollection(type);
    const batch = writeBatch(db);
    
    if (isSeries && data.isRecurring && data.recurrence?.frequency) {
        const recurrenceId = doc(collection(db, 'random')).id;
        let currentDate = new Date(data.dueDate as any);
        const endDate = data.recurrence.endDate ? new Date(data.recurrence.endDate as any) : addYears(currentDate, 5); // Limit to 5 years

        while (currentDate <= endDate) {
            const newDocRef = doc(coll);
            const accountData: any = {
                ...data,
                status: 'pending', // Recurring accounts are always created as pending
                paidAt: null,
                recurrenceId: recurrenceId,
                dueDate: Timestamp.fromDate(currentDate),
                createdAt: Timestamp.now(),
            };
            if(accountData.recurrence?.endDate) {
                accountData.recurrence.endDate = Timestamp.fromDate(new Date(accountData.recurrence.endDate as any));
            }
            batch.set(newDocRef, accountData);

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
        const newDocRef = doc(coll);
        const accountData: any = {
            ...data,
            createdAt: Timestamp.now(),
            dueDate: Timestamp.fromDate(new Date(data.dueDate as any)),
        };
        
        if (data.status === 'paid') {
            accountData.paidAt = Timestamp.fromDate(new Date(data.paidAt as any));
            createFinancialRecordInBatch(batch, type, accountData);
        } else {
            accountData.status = 'pending';
            accountData.paidAt = null;
        }

        if (data.isRecurring && data.recurrence?.endDate) {
            accountData.recurrence.endDate = Timestamp.fromDate(new Date(data.recurrence.endDate as any));
        }

        batch.set(newDocRef, accountData);
        await batch.commit();
        return newDocRef.id;
    }
}


export async function updateAccount(type: 'payable' | 'receivable', id: string, data: Partial<Omit<Account, 'id'>>, scope: 'single' | 'future' = 'single'): Promise<void> {
    const coll = getCollection(type);
    const docRef = doc(coll, id);

    const prepareDataForFirebase = (dataToPrepare: Partial<Omit<Account, 'id'>>) => {
        const prepared: any = { ...dataToPrepare };
        if (dataToPrepare.dueDate) prepared.dueDate = Timestamp.fromDate(new Date(dataToPrepare.dueDate));
        if (dataToPrepare.paidAt) {
             prepared.paidAt = Timestamp.fromDate(new Date(dataToPrepare.paidAt));
        } else if (dataToPrepare.status === 'pending') {
            prepared.paidAt = null;
        }
        if (dataToPrepare.recurrence?.endDate) prepared.recurrence.endDate = Timestamp.fromDate(new Date(dataToPrepare.recurrence.endDate));
        return prepared;
    };
    
    const batch = writeBatch(db);

    if (scope === 'single') {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error("Conta não encontrada.");
        
        const originalStatus = docSnap.data().status;
        const preparedData = prepareDataForFirebase(data);
        batch.update(docRef, preparedData);

        if (originalStatus === 'pending' && data.status === 'paid') {
            createFinancialRecordInBatch(batch, type, { ...docSnap.data(), ...data });
        }
        
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
        const originalData = docToUpdate.data();
        batch.update(docToUpdate.ref, preparedFutureUpdates);
        // Only create financial record if status changes from pending to paid
        if (originalData.status === 'pending' && data.status === 'paid') {
             createFinancialRecordInBatch(batch, type, { ...originalData, ...data });
        }
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
