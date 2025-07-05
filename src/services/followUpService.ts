'use server';

import { db } from '@/lib/firebase';
import type { FollowUpProcess, Mentorship, ActionItem, SerializableFollowUpProcess, ActionItemStatus } from '@/lib/types';
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

export async function getFollowUpProcesses(): Promise<SerializableFollowUpProcess[]> {
    try {
        const snapshot = await getDocs(followUpCollection);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => {
            const data = doc.data() as Omit<FollowUpProcess, 'id'>;
            
            const mentorships = (data.mentorships || []).map((m: any) => ({
                ...m,
                createdAt: m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : null,
            }));
    
            const actionPlan = (data.actionPlan || []).map((item: any) => {
                 // Backward compatibility for isCompleted
                const status: ActionItemStatus = item.status || (item.isCompleted ? 'approved' : 'pending');

                return {
                    ...item,
                    status,
                    dueDate: item.dueDate?.toDate ? item.dueDate.toDate().toISOString() : null,
                    submittedAt: item.submittedAt?.toDate ? item.submittedAt.toDate().toISOString() : null,
                    validatedAt: item.validatedAt?.toDate ? item.validatedAt.toDate().toISOString() : null,
                };
            });
    
            return {
                id: doc.id,
                contactId: data.contactId,
                contactName: data.contactName,
                productId: data.productId,
                productName: data.productName,
                status: data.status,
                mentorships,
                actionPlan,
            };
        });
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

export async function updateFollowUpProcess(followUpId: string, data: Partial<Omit<FollowUpProcess, 'id' | 'actionPlan'>> & { actionPlan?: ActionItem[] }): Promise<void> {
    try {
        const followUpDocRef = doc(db, 'acompanhamentos', followUpId);
        
        // Handle conversion of date strings back to Timestamps if needed
        if (data.actionPlan) {
            const planWithDates = data.actionPlan.map(item => {
                const newItem: any = { ...item };
                if (item.dueDate && typeof item.dueDate === 'string') {
                    newItem.dueDate = new Date(item.dueDate);
                }
                if (item.submittedAt && typeof item.submittedAt === 'string') {
                    newItem.submittedAt = new Date(item.submittedAt);
                }
                if (item.validatedAt && typeof item.validatedAt === 'string') {
                    newItem.validatedAt = new Date(item.validatedAt);
                }
                return newItem;
            });
            await updateDoc(followUpDocRef, { ...data, actionPlan: planWithDates });
        } else {
             await updateDoc(followUpDocRef, data);
        }

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
        
        actionPlan[taskIndex] = {
            ...actionPlan[taskIndex],
            status: 'submitted',
            validationText: validationData.validationText || '',
            validationAttachments: validationData.attachments || [],
            submittedAt: new Date(),
            rejectionReason: '', // Clear previous rejection reason
        };

        const planWithJSDates = actionPlan.map(item => {
            const newItem: any = { ...item };
            if (item.dueDate && typeof item.dueDate.toDate === 'function') { newItem.dueDate = item.dueDate.toDate(); }
            if (item.submittedAt && typeof item.submittedAt.toDate === 'function') { newItem.submittedAt = item.submittedAt.toDate(); }
            if (item.validatedAt && typeof item.validatedAt.toDate === 'function') { newItem.validatedAt = item.validatedAt.toDate(); }
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

export async function validateSubmittedTask(
    followUpId: string, 
    actionItemId: string, 
    newStatus: 'approved' | 'rejected',
    rejectionReason?: string
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
        
        actionPlan[taskIndex] = {
            ...actionPlan[taskIndex],
            status: newStatus,
            rejectionReason: newStatus === 'rejected' ? rejectionReason : '',
            validatedAt: new Date(),
        };

        const planWithJSDates = actionPlan.map(item => {
            const newItem: any = { ...item };
            if (item.dueDate && typeof item.dueDate.toDate === 'function') { newItem.dueDate = item.dueDate.toDate(); }
            if (item.submittedAt && typeof item.submittedAt.toDate === 'function') { newItem.submittedAt = item.submittedAt.toDate(); }
            if (item.validatedAt && typeof item.validatedAt.toDate === 'function') { newItem.validatedAt = item.validatedAt.toDate(); }
            return newItem;
        });

        await updateDoc(followUpDocRef, { actionPlan: planWithJSDates });

    } catch (error) {
        console.error("Error validating task:", error);
        if (error instanceof Error) throw error;
        throw new Error("Falha ao validar a tarefa.");
    }
}
