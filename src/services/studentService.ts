'use server';

import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Contact, FormationAccess } from '@/lib/types';
import { deleteUser as deleteUserFromCollection } from './userService';

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

        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            name: contact.name,
            avatarUrl: contact.avatarUrl || null,
            roleId: null,
            permissions: ['/formacoes', '/ferramentas'],
            formationAccess: accessWithTimestamps,
        });

        const contactDocRef = doc(db, 'contacts', contact.id);
        await updateDoc(contactDocRef, {
            studentAccess: { userId: user.uid }
        });

    } catch (error: any) {
        console.error("Error granting student access:", error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este email já está em uso por outro usuário.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        throw new Error('Falha ao conceder acesso de aluno.');
    }
}

export async function updateStudentAccess(userId: string, formationAccess: FormationAccess[]): Promise<void> {
    try {
        const userDocRef = doc(db, 'users', userId);
        const accessWithTimestamps = formationAccess.map(access => ({
          ...access,
          expiresAt: access.expiresAt ? Timestamp.fromDate(new Date(access.expiresAt)) : null,
        }));
        await updateDoc(userDocRef, {
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
    
    const userId = contact.studentAccess.userId;

    try {
        await deleteUserFromCollection(userId); 

        const contactDocRef = doc(db, 'contacts', contact.id);
        await updateDoc(contactDocRef, {
            studentAccess: null
        });

    } catch (error) {
        console.error("Error revoking student access:", error);
        throw new Error('Falha ao revogar o acesso de aluno.');
    }
}
