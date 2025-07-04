'use server';

import { db } from '@/lib/firebase';
import type { Tag } from '@/lib/types';
import { collection, getDocs, type DocumentData, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

function docToTag(doc: DocumentData): Tag {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
    };
}

export async function getTags(): Promise<Tag[]> {
  try {
    const tagsCollection = collection(db, 'tags');
    const tagSnapshot = await getDocs(tagsCollection);
    if (tagSnapshot.empty) {
        return [];
    }
    const tagList = tagSnapshot.docs.map(docToTag);
    return tagList;
  } catch (error) {
    console.error("Error fetching tags: ", error);
    return [];
  }
}

export async function createTag(data: { name: string, description?: string }): Promise<void> {
    try {
        const tagsCollection = collection(db, 'tags');
        await addDoc(tagsCollection, data);
    } catch (error) {
        console.error("Error creating tag: ", error);
        throw new Error("Falha ao criar tag.");
    }
}


export async function updateTag(tagId: string, data: { name: string, description?: string }): Promise<void> {
    try {
        const tagDocRef = doc(db, 'tags', tagId);
        await updateDoc(tagDocRef, data);
    } catch (error) {
        console.error("Error updating tag: ", error);
        throw new Error("Falha ao atualizar tag.");
    }
}

export async function deleteTag(tagId: string): Promise<void> {
    try {
        const tagDocRef = doc(db, 'tags', tagId);
        await deleteDoc(tagDocRef);
    } catch (error) {
        console.error("Error deleting tag: ", error);
        throw new Error("Falha ao excluir tag.");
    }
}
