'use server';

import { db } from '@/lib/firebase';
import type { Delivery } from '@/lib/types';
import { collection, getDocs, doc, updateDoc, addDoc, type DocumentData } from 'firebase/firestore';

function docToDelivery(doc: DocumentData): Delivery {
    const data = doc.data();
    return {
        id: doc.id,
        contactId: data.contactId,
        contactName: data.contactName,
        productId: data.productId,
        productName: data.productName,
        status: data.status,
        onboardingProgress: data.onboardingProgress || {},
    };
}


export async function getDeliveries(): Promise<Delivery[]> {
    try {
        const deliveriesCollection = collection(db, 'deliveries');
        const snapshot = await getDocs(deliveriesCollection);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(docToDelivery);
    } catch (error) {
        console.error("Error fetching deliveries: ", error);
        return [];
    }
}

export async function createDelivery(data: { contactId: string, contactName: string, productId: string, productName: string }): Promise<void> {
    try {
        const deliveryData: Omit<Delivery, 'id'> = {
            ...data,
            status: 'todo',
            onboardingProgress: {}
        };
        await addDoc(collection(db, 'deliveries'), deliveryData);
    } catch (error) {
        console.error("Error creating delivery:", error);
        throw new Error("Falha ao criar a entrega.");
    }
}

export async function updateDelivery(deliveryId: string, data: Partial<Omit<Delivery, 'id'>>): Promise<void> {
    try {
        const deliveryDoc = doc(db, 'deliveries', deliveryId);
        await updateDoc(deliveryDoc, data);
    } catch (error) {
        console.error(`Error updating delivery ${deliveryId}:`, error);
        throw new Error("Falha ao atualizar a entrega.");
    }
}
