'use server';

import { db } from '@/lib/firebase';
import type { Account, SerializableAccount } from '@/lib/types';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, type DocumentData, orderBy, query, where, Timestamp } from 'firebase/firestore';

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
        notes: data.notes,
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

export async function createAccount(type: 'payable' | 'receivable', data: Omit<Account, 'id' | 'createdAt' | 'paidAt' | 'status'>): Promise<void> {
    try {
        const coll = getCollection(type);
        const accountData: any = {
            ...data,
            status: 'pending',
            createdAt: Timestamp.now(),
            dueDate: Timestamp.fromDate(new Date(data.dueDate)),
        };
        if (data.isRecurring && data.recurrence?.endDate) {
            accountData.recurrence.endDate = Timestamp.fromDate(new Date(data.recurrence.endDate));
        }

        await addDoc(coll, accountData);
    } catch (error) {
        console.error(`Error creating account for ${type}: `, error);
        throw new Error("Falha ao criar conta.");
    }
}

export async function updateAccount(type: 'payable' | 'receivable', id: string, data: Partial<Omit<Account, 'id'>>): Promise<void> {
    try {
        const docRef = doc(getCollection(type), id);
        const accountData: Partial<any> = { ...data };
        if (data.dueDate) {
            accountData.dueDate = Timestamp.fromDate(new Date(data.dueDate));
        }
        if (data.recurrence?.endDate) {
            accountData.recurrence.endDate = Timestamp.fromDate(new Date(data.recurrence.endDate));
        }
         if (data.paidAt) {
            accountData.paidAt = Timestamp.fromDate(new Date(data.paidAt));
        }
        await updateDoc(docRef, accountData);
    } catch (error) {
        console.error(`Error updating account for ${type}: `, error);
        throw new Error("Falha ao atualizar conta.");
    }
}

export async function deleteAccount(type: 'payable' | 'receivable', id: string): Promise<void> {
    try {
        const docRef = doc(getCollection(type), id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting account for ${type}: `, error);
        throw new Error("Falha ao excluir conta.");
    }
}
