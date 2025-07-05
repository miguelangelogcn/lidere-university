'use server';

import { db } from '@/lib/firebase';
import type { OnboardingProcess } from '@/lib/types';
import { collection, getDocs, doc, updateDoc, addDoc, type DocumentData } from 'firebase/firestore';

const onboardingProcessCollection = collection(db, 'onboardings');

function docToOnboardingProcess(doc: DocumentData): OnboardingProcess {
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


export async function getOnboardingProcesses(): Promise<OnboardingProcess[]> {
    try {
        const snapshot = await getDocs(onboardingProcessCollection);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(docToOnboardingProcess);
    } catch (error) {
        console.error("Error fetching onboarding processes: ", error);
        return [];
    }
}

export async function createOnboardingProcess(data: { contactId: string, contactName: string, productId: string, productName: string }): Promise<void> {
    try {
        const onboardingData: Omit<OnboardingProcess, 'id'> = {
            ...data,
            status: 'todo',
            onboardingProgress: {}
        };
        await addDoc(onboardingProcessCollection, onboardingData);
    } catch (error) {
        console.error("Error creating onboarding process:", error);
        throw new Error("Falha ao criar o onboarding.");
    }
}

export async function updateOnboardingProcess(onboardingId: string, data: Partial<Omit<OnboardingProcess, 'id'>>): Promise<void> {
    try {
        const onboardingDoc = doc(db, 'onboardings', onboardingId);
        await updateDoc(onboardingDoc, data);
    } catch (error) {
        console.error(`Error updating onboarding process ${onboardingId}:`, error);
        throw new Error("Falha ao atualizar o onboarding.");
    }
}
