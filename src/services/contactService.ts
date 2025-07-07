'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Contact } from '@/lib/types';
import type { DocumentData } from 'firebase-admin/firestore';

function docToContact(doc: DocumentData): Contact {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
        email: data.email || null,
        phone: data.phone || '',
        tags: data.tags || [],
        city: data.city || null,
        maritalStatus: data.maritalStatus || null,
        age: data.age || null,
        gender: data.gender || null,
        avatarUrl: data.avatarUrl || null,
        studentAccess: data.studentAccess || null,
        formationAccess: (data.formationAccess || []).map((fa: any) => ({
            formationId: fa.formationId,
            expiresAt: fa.expiresAt?.toDate ? fa.expiresAt.toDate().toISOString() : null,
        })),
        formationProgress: data.formationProgress || {},
    };
}

export async function getContacts(): Promise<Contact[]> {
  try {
    const contactsCollection = adminDb.collection('contacts');
    const contactSnapshot = await contactsCollection.get();
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

export async function createContact(data: Omit<Contact, 'id' | 'avatarUrl' | 'studentAccess' | 'formationAccess' | 'formationProgress'>): Promise<void> {
    try {
        const contactsCollection = adminDb.collection('contacts');
        await contactsCollection.add(data);
    } catch (error) {
        console.error("Error creating contact: ", error);
        throw new Error("Falha ao criar contato.");
    }
}


export async function updateContact(contactId: string, data: Partial<Omit<Contact, 'id'>>): Promise<void> {
    try {
        const contactDocRef = adminDb.collection('contacts').doc(contactId);
        await contactDocRef.update(data);
    } catch (error) {
        console.error("Error updating contact: ", error);
        throw new Error("Falha ao atualizar contato.");
    }
}

export async function deleteContact(contactId: string): Promise<void> {
    try {
        const contactDocRef = adminDb.collection('contacts').doc(contactId);
        const docSnap = await contactDocRef.get();
        
        if (docSnap.exists) {
            const contactData = docSnap.data();
            // If the contact is also a student (has an auth account), delete it.
            if (contactData?.studentAccess?.userId) {
                try {
                    await adminAuth.deleteUser(contactData.studentAccess.userId);
                } catch (authError: any) {
                    if (authError.code !== 'auth/user-not-found') {
                         console.error("Error deleting auth user during contact deletion:", authError);
                         // Fail the whole operation if we can't delete the auth user, to avoid orphans.
                         throw new Error("Falha ao excluir o usuário de autenticação associado.");
                    }
                    // If user not found in auth, we can just proceed to delete from Firestore.
                    console.warn(`Auth user ${contactData.studentAccess.userId} not found, proceeding with Firestore deletion.`);
                }
            }
        }
        
        // Delete the contact document from Firestore
        await contactDocRef.delete();
    } catch (error) {
        console.error("Error deleting contact: ", error);
        if (error instanceof Error) throw error;
        throw new Error("Falha ao excluir contato.");
    }
}
