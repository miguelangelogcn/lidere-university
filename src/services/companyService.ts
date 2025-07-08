'use server';

import { db } from '@/lib/firebase';
import type { Company } from '@/lib/types';
import { collection, getDocs, type DocumentData, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const companiesCollection = collection(db, 'fin-empresas');

function docToCompany(doc: DocumentData): Company {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
        initialCash: data.initialCash,
    };
}

export async function getCompanies(): Promise<Company[]> {
    try {
        const snapshot = await getDocs(companiesCollection);
        if (snapshot.empty) return [];
        return snapshot.docs.map(docToCompany);
    } catch (error) {
        console.error("Error fetching companies: ", error);
        throw new Error("Falha ao buscar empresas.");
    }
}

export async function createCompany(data: { name: string; initialCash?: number }): Promise<void> {
    const batch = writeBatch(db);
    try {
        const newCompanyRef = doc(collection(db, 'fin-empresas'));
        
        const companyData: { name: string, initialCash?: number } = { name: data.name };
        if (data.initialCash) {
            companyData.initialCash = data.initialCash;
        }
        
        batch.set(newCompanyRef, companyData);

        if (data.initialCash && data.initialCash > 0) {
            const financialRecordsRef = doc(collection(db, 'fin-registros'));
            batch.set(financialRecordsRef, {
                description: 'Caixa Inicial',
                amount: data.initialCash,
                type: 'income',
                date: new Date(),
                category: 'Capital Inicial',
                companyId: newCompanyRef.id,
                companyName: data.name,
                createdAt: new Date()
            });
        }
        
        await batch.commit();
    } catch (error) {
        console.error("Error creating company: ", error);
        throw new Error("Falha ao criar empresa.");
    }
}

export async function updateCompany(id: string, data: { name: string }): Promise<void> {
    try {
        const companyDoc = doc(db, 'fin-empresas', id);
        await updateDoc(companyDoc, data);
    } catch (error) {
        console.error("Error updating company: ", error);
        throw new Error("Falha ao atualizar empresa.");
    }
}

export async function deleteCompany(id: string): Promise<void> {
    try {
        // Here you might want to check if there are any financial records associated with this company before deleting.
        // For simplicity, I'm allowing deletion for now.
        const companyDoc = doc(db, 'fin-empresas', id);
        await deleteDoc(companyDoc);
    } catch (error) {
        console.error("Error deleting company: ", error);
        throw new Error("Falha ao excluir empresa.");
    }
}
