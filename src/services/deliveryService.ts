'use server';

import { db } from '@/lib/firebase';
import type { Delivery } from '@/lib/types';
import { collection, getDocs, doc, updateDoc, type DocumentData } from 'firebase/firestore';

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
            // TODO: Remove this mock data once there's a way to create deliveries
            return [
                { id: 'del1', contactId: 'c1', contactName: 'João da Silva', productId: 'p1', productName: 'Consultoria Premium', status: 'todo', onboardingProgress: {} },
                { id: 'del2', contactId: 'c2', contactName: 'Maria Oliveira', productId: 'p2', productName: 'Mentoria Individual', status: 'doing', onboardingProgress: { 'step1': true } },
                { id: 'del3', contactId: 'c3', contactName: 'Pedro Santos', productId: 'p1', productName: 'Consultoria Premium', status: 'done', onboardingProgress: {} },
            ];
        }
        return snapshot.docs.map(docToDelivery);
    } catch (error) {
        console.error("Error fetching deliveries: ", error);
        return [];
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
