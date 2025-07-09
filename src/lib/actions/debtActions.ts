
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, Timestamp, query, where, getDocs, orderBy, type DocumentData, deleteDoc } from 'firebase/firestore';
import { addMonths } from 'date-fns';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Debt, SerializableDebt } from '../types';

export const debtSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  creditor: z.string().min(1, 'O credor é obrigatório.'),
  totalAmount: z.coerce.number().positive('O valor total deve ser positivo.'),
  companyId: z.string().min(1, 'A empresa é obrigatória.'),
  companyName: z.string(),
  interestRate: z.coerce.number().min(0, 'A taxa de juros não pode ser negativa.').optional().default(0),
  isInstallment: z.boolean().default(false),
  totalInstallments: z.coerce.number().int().min(1, "O número de parcelas deve ser pelo menos 1.").optional(),
  firstDueDate: z.date({ required_error: 'A data da primeira parcela é obrigatória.' }),
}).refine(data => !data.isInstallment || (data.isInstallment && data.totalInstallments), {
  message: "O número de parcelas é obrigatório para dívidas parceladas.",
  path: ['totalInstallments'],
});

export type DebtFormValues = z.infer<typeof debtSchema>;

export async function createDebt(data: DebtFormValues) {
    const validation = debtSchema.safeParse(data);
    if (!validation.success) {
        throw new Error('Dados inválidos.');
    }

    const {
        description,
        creditor,
        totalAmount,
        companyId,
        companyName,
        interestRate,
        isInstallment,
        totalInstallments,
        firstDueDate
    } = validation.data;

    const batch = writeBatch(db);
    const debtsCollection = collection(db, 'fin-dividas');
    const payablesCollection = collection(db, 'contas-a-pagar');

    // 1. Create the main Debt document
    const newDebtRef = doc(debtsCollection);
    const debtData: Omit<Debt, 'id'> = {
        description,
        creditor,
        totalAmount,
        companyId,
        companyName,
        interestRate,
        isInstallment,
        totalInstallments: totalInstallments || 1,
        paidInstallments: 0, // Calculated from payables later
        status: 'active',
        createdAt: Timestamp.now(),
    };
    batch.set(newDebtRef, debtData);
    
    // 2. Create all payable accounts for each installment
    const numInstallments = isInstallment ? totalInstallments! : 1;
    const principalPerInstallment = totalAmount / numInstallments;
    
    for (let i = 0; i < numInstallments; i++) {
        const dueDate = addMonths(firstDueDate, i);
        
        // Simple interest calculation on the remaining principal for the month
        const remainingPrincipal = totalAmount - (principalPerInstallment * i);
        const interestForMonth = interestRate > 0 ? remainingPrincipal * (interestRate / 100 / 12) : 0;
        const installmentAmount = principalPerInstallment + interestForMonth;

        const newPayableRef = doc(payablesCollection);
        batch.set(newPayableRef, {
            description: `${description} (${creditor}) - Parcela ${i + 1}/${numInstallments}`,
            amount: installmentAmount,
            dueDate: Timestamp.fromDate(dueDate),
            category: 'Empréstimos e Dívidas',
            companyId,
            companyName,
            status: 'pending',
            isRecurring: false,
            createdAt: Timestamp.now(),
            sourceDebtId: newDebtRef.id,
        });
    }

    await batch.commit();
    revalidatePath('/contas');
    revalidatePath('/dividas');
}


function docToSerializableDebt(doc: DocumentData): SerializableDebt {
    const data = doc.data();
    return {
        id: doc.id,
        description: data.description,
        creditor: data.creditor,
        companyId: data.companyId,
        companyName: data.companyName,
        totalAmount: data.totalAmount,
        interestRate: data.interestRate,
        isInstallment: data.isInstallment,
        totalInstallments: data.totalInstallments,
        paidInstallments: data.paidInstallments,
        status: data.status,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    };
}


export async function getDebts(): Promise<SerializableDebt[]> {
    try {
        const q = query(collection(db, 'fin-dividas'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];

        const debts = snapshot.docs.map(docToSerializableDebt);
        
        // In a real app, you might want to query contas-a-pagar to get the real paidInstallments count.
        // For simplicity here, we'll return the stored count.

        return debts;
    } catch (error) {
        console.error("Error fetching debts: ", error);
        throw new Error("Falha ao buscar dívidas.");
    }
}


export async function deleteDebt(debtId: string): Promise<void> {
    const batch = writeBatch(db);

    // 1. Delete the main debt document
    const debtRef = doc(db, 'fin-dividas', debtId);
    batch.delete(debtRef);

    // 2. Find and delete all associated payable accounts
    const payablesQuery = query(collection(db, 'contas-a-pagar'), where('sourceDebtId', '==', debtId));
    const payablesSnapshot = await getDocs(payablesQuery);

    if (!payablesSnapshot.empty) {
        payablesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    await batch.commit();
    revalidatePath('/contas');
    revalidatePath('/dividas');
}
