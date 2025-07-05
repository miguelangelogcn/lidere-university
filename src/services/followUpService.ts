'use server';

import { db } from '@/lib/firebase';
import type { FollowUpProcess } from '@/lib/types';
import { collection, getDocs, type DocumentData, addDoc } from 'firebase/firestore';

const followUpCollection = collection(db, 'acompanhamentos');

function docToFollowUpProcess(doc: DocumentData): FollowUpProcess {
    const data = doc.data();
    return {
        id: doc.id,
        contactId: data.contactId,
        contactName: data.contactName,
        productId: data.productId,
        productName: data.productName,
        status: data.status,
    };
}

export async function getFollowUpProcesses(): Promise<FollowUpProcess[]> {
    try {
        const snapshot = await getDocs(followUpCollection);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(docToFollowUpProcess);
    } catch (error) {
        console.error("Error fetching follow-up processes: ", error);
        return [];
    }
}

export async function createFollowUpProcess(data: {
    contactId: string;
    contactName: string;
    productId: string;
    productName: string;
}): Promise<void> {
    try {
        const followUpData: Omit<FollowUpProcess, 'id'> = {
            ...data,
            status: 'todo',
        };
        await addDoc(followUpCollection, followUpData);
    } catch (error) {
        console.error("Error creating follow-up process:", error);
        throw new Error("Falha ao criar o acompanhamento.");
    }
}
