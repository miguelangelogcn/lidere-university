'use server';

import { db } from '@/lib/firebase';
import type { CreditCard } from '@/lib/types';
import { getNextInvoiceDate } from '@/lib/utils';
import { collection, getDocs, type DocumentData, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';

const creditCardsCollection = collection(db, 'fin-cartoes');

function docToCreditCard(doc: DocumentData): CreditCard {
    const data = doc.data();
    return {
        id: doc.id,
        companyId: data.companyId,
        cardName: data.cardName,
        cardLimit: data.cardLimit,
        invoiceDueDate: data.invoiceDueDate,
        cardLastFourDigits: data.cardLastFourDigits,
    };
}

export async function getCreditCardsByCompany(companyId: string): Promise<CreditCard[]> {
    try {
        const q = query(creditCardsCollection, where('companyId', '==', companyId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs.map(docToCreditCard);
    } catch (error) {
        console.error("Error fetching credit cards: ", error);
        throw new Error("Falha ao buscar cartões de crédito.");
    }
}

export async function createCreditCard(data: Omit<CreditCard, 'id'> & { initialInvoiceAmount?: number, companyName: string }): Promise<void> {
    const batch = writeBatch(db);
    try {
        const newCardRef = doc(collection(db, 'fin-cartoes'));
        const { initialInvoiceAmount, companyName, ...cardData } = data;
        batch.set(newCardRef, cardData);

        if (initialInvoiceAmount && initialInvoiceAmount > 0) {
            const accountsPayableRef = doc(collection(db, 'contas-a-pagar'));
            const invoiceDate = getNextInvoiceDate(cardData.invoiceDueDate);

            batch.set(accountsPayableRef, {
                description: `Fatura Cartão - ${cardData.cardName}`,
                amount: initialInvoiceAmount,
                dueDate: invoiceDate,
                category: 'Cartão de Crédito',
                companyId: cardData.companyId,
                companyName: companyName,
                status: 'pending',
                isRecurring: false,
                createdAt: new Date()
            });
        }
        
        await batch.commit();
    } catch (error) {
        console.error("Error creating credit card: ", error);
        throw new Error("Falha ao criar cartão de crédito.");
    }
}

export async function deleteCreditCard(id: string): Promise<void> {
    try {
        const docRef = doc(db, 'fin-cartoes', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting credit card: ", error);
        throw new Error("Falha ao excluir cartão de crédito.");
    }
}
