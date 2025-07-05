'use server';

import { db } from '@/lib/firebase';
import type { Formation } from '@/lib/types';
import { collection, getDocs, type DocumentData, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

function docToFormation(doc: DocumentData): Formation {
    const data = doc.data();
    // Sort modules and lessons by their order property
    const modules = (data.modules || []).map((module: any) => ({
        ...module,
        lessons: (module.lessons || []).sort((a: any, b: any) => a.order - b.order),
    })).sort((a: any, b: any) => a.order - b.order);

    return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        modules: modules,
    };
}

export async function getFormations(): Promise<Formation[]> {
  try {
    const formationsCollection = collection(db, 'formacoes');
    const formationSnapshot = await getDocs(formationsCollection);
    if (formationSnapshot.empty) {
        return [];
    }
    const formationList = formationSnapshot.docs.map(docToFormation);
    return formationList;
  } catch (error) {
    console.error("Error fetching formations: ", error);
    return [];
  }
}

export async function getFormationById(id: string): Promise<Formation | null> {
    try {
        const formationDocRef = doc(db, 'formacoes', id);
        const docSnap = await getDoc(formationDocRef);
        if (docSnap.exists()) {
            return docToFormation(docSnap);
        }
        return null;
    } catch (error) {
        console.error("Error fetching formation by id: ", error);
        return null;
    }
}

export async function createFormation(data: Omit<Formation, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'formacoes'), data);
        return docRef.id;
    } catch (error) {
        console.error("Error creating formation: ", error);
        throw new Error("Falha ao criar formação.");
    }
}

export async function updateFormation(id: string, data: Partial<Omit<Formation, 'id'>>): Promise<void> {
    try {
        const formationDocRef = doc(db, 'formacoes', id);
        await updateDoc(formationDocRef, data);
    } catch (error) {
        console.error("Error updating formation: ", error);
        throw new Error("Falha ao atualizar formação.");
    }
}

export async function deleteFormation(id: string): Promise<void> {
    try {
        const formationDocRef = doc(db, 'formacoes', id);
        await deleteDoc(formationDocRef);
    } catch (error) {
        console.error("Error deleting formation: ", error);
        throw new Error("Falha ao excluir formação.");
    }
}
