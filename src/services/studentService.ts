'use server';

import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Contact, FormationAccess } from '@/lib/types';

export async function grantStudentAccess(contact: Contact, password: string, formationAccess: FormationAccess[]): Promise<void> {
    if (!contact.email) {
        throw new Error('O contato não possui um email para criar o acesso.');
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, contact.email, password);
        const user = userCredential.user;

        const accessWithTimestamps = formationAccess.map(access => ({
            ...access,
            expiresAt: access.expiresAt ? Timestamp.fromDate(new Date(access.expiresAt)) : null,
        }));
        
        const contactDocRef = doc(db, 'contacts', contact.id);
        await updateDoc(contactDocRef, {
            studentAccess: { userId: user.uid },
            formationAccess: accessWithTimestamps,
        });

    } catch (error: any) {
        console.error("Error granting student access:", error);
        if (error.code === 'auth/email-already-in-use') {
            try {
                // If user exists in Auth but not linked, link them
                const contactDocRef = doc(db, 'contacts', contact.id);
                // We cannot get user UID here without admin SDK.
                // We will inform the user to reset password.
                await sendPasswordResetEmail(auth, contact.email);
                throw new Error('Este email já está em uso. Um email de redefinição de senha foi enviado para que ele possa acessar com uma nova senha.');
            } catch (resetError) {
                console.error("Error sending password reset email:", resetError);
                throw new Error('Este email já está em uso por outro usuário.');
            }
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        throw new Error('Falha ao conceder acesso de aluno.');
    }
}

export async function updateStudentAccess(contactId: string, formationAccess: FormationAccess[]): Promise<void> {
    try {
        const contactDocRef = doc(db, 'contacts', contactId);
        const accessWithTimestamps = formationAccess.map(access => ({
          ...access,
          expiresAt: access.expiresAt ? Timestamp.fromDate(new Date(access.expiresAt)) : null,
        }));
        await updateDoc(contactDocRef, {
            formationAccess: accessWithTimestamps
        });
    } catch (error) {
        console.error("Error updating student access:", error);
        throw new Error("Falha ao atualizar acesso do aluno.");
    }
}

export async function revokeStudentAccess(contact: Contact): Promise<void> {
    if (!contact.studentAccess?.userId) {
        throw new Error('Este contato não possui um acesso de aluno para ser revogado.');
    }
    
    // NOTE: This does not delete the user from Firebase Auth, as it requires admin privileges
    // not available on the client-side. The user will still be able to log in, but won't
    // be recognized by the app as a student or employee.
    try {
        const contactDocRef = doc(db, 'contacts', contact.id);
        await updateDoc(contactDocRef, {
            studentAccess: null,
            formationAccess: [],
        });

    } catch (error) {
        console.error("Error revoking student access:", error);
        throw new Error('Falha ao revogar o acesso de aluno.');
    }
}
