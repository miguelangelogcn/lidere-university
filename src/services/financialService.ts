'use server';

import { db } from '@/lib/firebase';
import type { FinancialRecord, SerializableFinancialRecord } from '@/lib/types';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, type DocumentData, orderBy, query } from 'firebase/firestore';

const recordsCollection = collection(db, 'fin-registros');

function docToSerializableFinancialRecord(doc: DocumentData): SerializableFinancialRecord {
    const data = doc.data();
    return {
        id: doc.id,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category || '',
        date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
    };
}

export async function getFinancialRecords(): Promise<SerializableFinancialRecord[]> {
    try {
        const q = query(recordsCollection, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs.map(docToSerializableFinancialRecord);
    } catch (error) {
        console.error("Error fetching financial records: ", error);
        throw new Error("Falha ao buscar registros financeiros.");
    }
}

export async function addFinancialRecord(data: Omit<FinancialRecord, 'id' | 'createdAt'>): Promise<void> {
    try {
        const recordData = {
            ...data,
            date: new Date(data.date), // Ensure it's a JS Date object
            createdAt: new Date()
        };
        await addDoc(recordsCollection, recordData);
    } catch (error) {
        console.error("Error adding financial record: ", error);
        throw new Error("Falha ao adicionar registro financeiro.");
    }
}

export async function deleteFinancialRecord(id: string): Promise<void> {
    try {
        const recordDoc = doc(db, 'fin-registros', id);
        await deleteDoc(recordDoc);
    } catch (error) {
        console.error("Error deleting financial record: ", error);
        throw new Error("Falha ao excluir registro financeiro.");
    }
}
