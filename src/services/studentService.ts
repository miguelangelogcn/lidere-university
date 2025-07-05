'use server';

import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, query, where, setDoc, updateDoc } from 'firebase/firestore';
import type { Contact, Role } from '@/lib/types';
import { deleteUser as deleteUserFromCollection } from './userService';

async function getStudentRole(): Promise<Role | null> {
    const rolesCollection = collection(db, 'roles');
    const q = query(rolesCollection, where("name", "==", "Aluno"));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const roleDoc = querySnapshot.docs[0];
    return { id: roleDoc.id, ...roleDoc.data() } as Role;
}


export async function grantStudentAccess(contact: Contact, password: string): Promise<void> {
    if (!contact.email) {
        throw new Error('O contato não possui um email para criar o acesso.');
    }

    const studentRole = await getStudentRole();
    if (!studentRole) {
        throw new Error("O cargo 'Aluno' não foi encontrado. Por favor, crie-o na tela de 'Gerenciar Cargos' com as permissões de conteúdo.");
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, contact.email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            name: contact.name,
            avatarUrl: contact.avatarUrl || null,
            roleId: studentRole.id,
            permissions: [],
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
