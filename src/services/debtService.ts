'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { Debt, SerializableDebt } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import { addMonths } from 'date-fns';

const debtsCollection = adminDb.collection('dividas');

function docToSerializableDebt(doc: FirebaseFirestore.DocumentSnapshot): SerializableDebt {
    const data = doc.data() as Debt;
    return {
        id: doc.id,
        description: data.description,
        creditor: data.creditor,
        originalAmount: data.originalAmount,
        interestRate: data.interestRate,
        companyId: data.companyId,
        companyName: data.companyName,
        status: data.status,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        negotiationDetails: data.negotiationDetails ? {
            ...data.negotiationDetails,
            firstInstallmentDate: (data.negotiationDetails.firstInstallmentDate as Timestamp).toDate().toISOString(),
        } : null,
    };
}

export async function getDebts(): Promise<SerializableDebt[]> {
    try {
        const snapshot = await debtsCollection.orderBy('createdAt', 'desc').get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(docToSerializableDebt);
    } catch (error) {
        console.error("Error fetching debts: ", error);
        throw new Error("Falha ao buscar dívidas.");
    }
}

export async function createDebt(data: Omit<Debt, 'id' | 'createdAt' | 'status' | 'negotiationDetails'>): Promise<void> {
    try {
        const debtData: any = {
            ...data,
            status: 'aberta',
            createdAt: Timestamp.now(),
        };
        await debtsCollection.add(debtData);
    } catch (error) {
        console.error("Error creating debt: ", error);
        throw new Error("Falha ao criar dívida.");
    }
}

export async function deleteDebt(id: string): Promise<void> {
    try {
        const docRef = debtsCollection.doc(id);
        await docRef.delete();
    } catch (error) {
        console.error("Error deleting debt: ", error);
        throw new Error("Falha ao excluir dívida.");
    }
}

export async function negotiateDebt(debtId: string, negotiationData: {
    numberOfInstallments: number;
    installmentAmount: number;
    firstInstallmentDate: Date;
}): Promise<void> {
    const batch = adminDb.batch();
    const debtRef = debtsCollection.doc(debtId);
    
    try {
        const debtDoc = await debtRef.get();
        if (!debtDoc.exists) {
            throw new Error("Dívida não encontrada.");
        }
        const debt = debtDoc.data() as Debt;
        
        if (debt.status === 'negociada' || debt.status === 'paga') {
             throw new Error("Esta dívida já foi negociada ou paga.");
        }

        const accountsPayableCollection = adminDb.collection('contas-a-pagar');
        const linkedAccountIds: string[] = [];

        for (let i = 0; i < negotiationData.numberOfInstallments; i++) {
            const dueDate = addMonths(negotiationData.firstInstallmentDate, i);
            const newAccountRef = accountsPayableCollection.doc();
            
            batch.set(newAccountRef, {
                description: `${debt.description} - Parcela ${i + 1}/${negotiationData.numberOfInstallments}`,
                amount: negotiationData.installmentAmount,
                dueDate: Timestamp.fromDate(dueDate),
                companyId: debt.companyId,
                companyName: debt.companyName || '',
                status: 'pending',
                isRecurring: false,
                notes: `Gerado a partir da negociação da dívida ID: ${debtId}`,
                createdAt: Timestamp.now(),
            });
            
            linkedAccountIds.push(newAccountRef.id);
        }
        
        const finalNegotiationDetails = {
            numberOfInstallments: negotiationData.numberOfInstallments,
            installmentAmount: negotiationData.installmentAmount,
            firstInstallmentDate: Timestamp.fromDate(negotiationData.firstInstallmentDate),
            linkedAccountIds: linkedAccountIds,
        };

        batch.update(debtRef, {
            status: 'negociada',
            negotiationDetails: finalNegotiationDetails,
        });
        
        await batch.commit();

    } catch (error) {
        console.error("Error negotiating debt: ", error);
        if (error instanceof Error) throw error;
        throw new Error("Falha ao negociar dívida.");
    }
}
