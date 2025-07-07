'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Contact, FormationAccess } from '@/lib/types';


export async function grantStudentAccess(contact: Contact, password: string, formationAccess: { formationId: string, expiresAt: Date | null }[]): Promise<void> {
    if (!contact.email) {
        throw new Error('O contato não possui um email para criar o acesso.');
    }

    try {
        const userRecord = await adminAuth.createUser({
            email: contact.email,
            password: password,
            displayName: contact.name,
            emailVerified: true,
        });

        const accessWithTimestamps = formationAccess.map(access => ({
            ...access,
            expiresAt: access.expiresAt ? Timestamp.fromDate(access.expiresAt) : null,
        }));
        
        const contactDocRef = adminDb.collection('contacts').doc(contact.id);
        await contactDocRef.update({
            studentAccess: { userId: userRecord.uid },
            formationAccess: accessWithTimestamps,
        });
    } catch (error: any) {
        console.error("Error granting student access:", error);
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Este email já está em uso por outro usuário.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        throw new Error('Falha ao conceder acesso de aluno.');
    }
}

export async function updateStudentAccess(contactId: string, formationAccess: { formationId: string, expiresAt: Date | null }[]): Promise<void> {
    try {
        const contactDocRef = adminDb.collection('contacts').doc(contactId);
        const accessWithTimestamps = formationAccess.map(access => ({
          ...access,
          expiresAt: access.expiresAt ? Timestamp.fromDate(access.expiresAt) : null,
        }));
        await contactDocRef.update({
            formationAccess: accessWithTimestamps
        });
    } catch (error: any) {
        console.error("Error updating student access:", error);
        throw new Error("Falha ao atualizar acesso do aluno.");
    }
}

export async function revokeStudentAccess(contact: Contact): Promise<void> {
    if (!contact.studentAccess?.userId) {
        throw new Error('Este contato não possui um acesso de aluno para ser revogado.');
    }
    
    try {
        const userId = contact.studentAccess.userId;
        const contactDocRef = adminDb.collection('contacts').doc(contact.id);
        
        // Delete from Auth first
        await adminAuth.deleteUser(userId);

        // Then update Firestore
        await contactDocRef.update({
            studentAccess: null,
            formationAccess: [],
        });

    } catch (error: any) {
        console.error("Error revoking student access:", error);
        if (error.code === 'auth/user-not-found') {
            // If user doesn't exist in auth, just clean up firestore
            console.warn(`User ${contact.studentAccess.userId} not found in Auth. Cleaning up Firestore record.`);
            const contactDocRef = adminDb.collection('contacts').doc(contact.id);
            await contactDocRef.update({
                studentAccess: null,
                formationAccess: [],
            });
            return;
        }
        throw new Error(`Falha ao revogar o acesso de aluno: ${error.message}`);
    }
}
