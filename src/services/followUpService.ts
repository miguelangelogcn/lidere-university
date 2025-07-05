'use server';

import { db } from '@/lib/firebase';
import type { FollowUpProcess, Mentorship, ActionItem } from '@/lib/types';
import { collection, getDocs, type DocumentData, addDoc, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

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
        mentorships: data.mentorships || [],
        actionPlan: data.actionPlan || [],
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
            mentorships: [],
            actionPlan: [],
        };
        await addDoc(followUpCollection, followUpData);
    } catch (error) {
        console.error("Error creating follow-up process:", error);
        throw new Error("Falha ao criar o acompanhamento.");
    }
}

export async function addMentorship(followUpId: string, mentorshipData: Omit<Mentorship, 'id' | 'createdAt'>): Promise<void> {
    try {
        const followUpDocRef = doc(db, 'acompanhamentos', followUpId);
        const newMentorship: Mentorship = {
            ...mentorshipData,
            id: doc(collection(db, 'random')).id,
            createdAt: new Date(),
        };

        await updateDoc(followUpDocRef, {
            mentorships: arrayUnion(newMentorship)
        });
    } catch (error) {
        console.error("Error adding mentorship:", error);
        throw new Error("Falha ao adicionar mentoria.");
    }
}

export async function updateFollowUpProcess(followUpId: string, data: Partial<Omit<FollowUpProcess, 'id'>>): Promise<void> {
    try {
        const followUpDocRef = doc(db, 'acompanhamentos', followUpId);
        await updateDoc(followUpDocRef, data);
    } catch (error) {
        console.error("Error updating follow-up process:", error);
        throw new Error("Falha ao atualizar o acompanhamento.");
    }
}

export async function getFollowUpProcessById(id: string): Promise<FollowUpProcess | null> {
    try {
        const docRef = doc(db, 'acompanhamentos', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docToFollowUpProcess(docSnap);
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching follow-up process by ID: ", error);
        return null;
    }
}

export async function submitTaskValidation(
    followUpId: string, 
    actionItemId: string, 
    validationData: { 
        validationText?: string; 
        attachments: { name: string; url: string }[];
    }
): Promise<void> {
    const followUpDocRef = doc(db, 'acompanhamentos', followUpId);
    try {
        const docSnap = await getDoc(followUpDocRef);
        if (!docSnap.exists()) {
            throw new Error("Processo de acompanhamento não encontrado.");
        }

        const process = docToFollowUpProcess(docSnap);
        const actionPlan = process.actionPlan || [];

        const taskIndex = actionPlan.findIndex(item => item.id === actionItemId);
        if (taskIndex === -1) {
            throw new Error("Ação não encontrada no plano.");
        }
        
        // Update the task in the array
        actionPlan[taskIndex] = {
            ...actionPlan[taskIndex],
            isCompleted: true,
            validationText: validationData.validationText || '',
            validationAttachments: validationData.attachments || [],
            submittedAt: new Date(),
        };

        // Before writing, map over the entire array and convert any Firestore Timestamps
        // back to JS Dates to prevent them from being stored as map objects.
        const planWithJSDates = actionPlan.map(item => {
            const newItem = { ...item };
            if (item.dueDate && typeof item.dueDate.toDate === 'function') {
                newItem.dueDate = item.dueDate.toDate();
            }
            if (item.submittedAt && typeof item.submittedAt.toDate === 'function') {
                newItem.submittedAt = item.submittedAt.toDate();
            }
            return newItem;
        });


        await updateDoc(followUpDocRef, { actionPlan: planWithJSDates });

    } catch (error) {
        console.error("Error submitting task validation:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Falha ao enviar validação da tarefa.");
    }
}