'use server';

import { db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import { collection, getDocs, type DocumentData, doc, updateDoc, deleteDoc } from 'firebase/firestore';

function docToAppUser(doc: DocumentData): AppUser {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || data.displayName || null,
        email: data.email || null,
        avatarUrl: data.avatarUrl || data.photoURL || null,
        permissions: data.permissions || [],
        roleId: data.roleId || null,
    };
}

export async function getUsers(): Promise<AppUser[]> {
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    if (userSnapshot.empty) {
        return [];
    }
    const userList = userSnapshot.docs.map(docToAppUser);
    return userList;
  } catch (error) {
    console.error("Error fetching users: ", error);
    return [];
  }
}

export async function updateUser(userId: string, data: { name: string; permissions: string[], roleId: string | null }): Promise<void> {
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            name: data.name,
            permissions: data.permissions,
            roleId: data.roleId,
        });
    } catch (error) {
        console.error("Error updating user: ", error);
        throw new Error("Falha ao atualizar usuário.");
    }
}

export async function deleteUser(userId: string): Promise<void> {
    try {
        const userDocRef = doc(db, 'users', userId);
        await deleteDoc(userDocRef);
    } catch (error) {
        console.error("Error deleting user: ", error);
        throw new Error("Falha ao excluir usuário.");
    }
}
