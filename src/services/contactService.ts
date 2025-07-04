'use server';

import { db } from '@/lib/firebase';
import type { Contact } from '@/lib/types';
import { collection, getDocs, type DocumentData, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

function docToContact(doc: DocumentData): Contact {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        company: data.company || '',
        phone: data.phone || '',
        status: data.status || 'lead',
        avatarUrl: data.avatarUrl || null,
    };
}

export async function getContacts(): Promise<Contact[]> {
  try {
    const contactsCollection = collection(db, 'contacts');
    const contactSnapshot = await getDocs(contactsCollection);
    if (contactSnapshot.empty) {
        return [];
    }
    const contactList = contactSnapshot.docs.map(docToContact);
    return contactList;
  } catch (error) {
    console.error("Error fetching contacts: ", error);
    return [];
  }
}

export async function createContact(data: Omit<Contact, 'id' | 'avatarUrl'>): Promise<void> {
    try {
        const contactsCollection = collection(db, 'contacts');
        await addDoc(contactsCollection, data);
    } catch (error) {
        console.error("Error creating contact: ", error);
        throw new Error("Falha ao criar contato.");
    }
}


export async function updateContact(contactId: string, data: Partial<Omit<Contact, 'id'>>): Promise<void> {
    try {
        const contactDocRef = doc(db, 'contacts', contactId);
        await updateDoc(contactDocRef, data);
    } catch (error) {
        console.error("Error updating contact: ", error);
        throw new Error("Falha ao atualizar contato.");
    }
}

export async function deleteContact(contactId: string): Promise<void> {
    try {
        const contactDocRef = doc(db, 'contacts', contactId);
        await deleteDoc(contactDocRef);
    } catch (error) {
        console.error("Error deleting contact: ", error);
        throw new Error("Falha ao excluir contato.");
    }
}
