'use server';

import { db } from '@/lib/firebase';
import type { Role } from '@/lib/types';
import { collection, getDocs, type DocumentData, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

function docToRole(doc: DocumentData): Role {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
        permissions: data.permissions || [],
    };
}

export async function getRoles(): Promise<Role[]> {
  try {
    const rolesCollection = collection(db, 'roles');
    const roleSnapshot = await getDocs(rolesCollection);
    if (roleSnapshot.empty) {
        return [];
    }
    const roleList = roleSnapshot.docs.map(docToRole);
    return roleList;
  } catch (error) {
    console.error("Error fetching roles: ", error);
    return [];
  }
}

export async function createRole(data: { name: string, permissions: string[] }): Promise<void> {
    try {
        const rolesCollection = collection(db, 'roles');
        await addDoc(rolesCollection, data);
    } catch (error) {
        console.error("Error creating role: ", error);
        throw new Error("Falha ao criar cargo.");
    }
}


export async function updateRole(roleId: string, data: { name: string, permissions: string[] }): Promise<void> {
    try {
        const roleDocRef = doc(db, 'roles', roleId);
        await updateDoc(roleDocRef, {
            name: data.name,
            permissions: data.permissions
        });
    } catch (error) {
        console.error("Error updating role: ", error);
        throw new Error("Falha ao atualizar cargo.");
    }
}

export async function deleteRole(roleId: string): Promise<void> {
    try {
        const roleDocRef = doc(db, 'roles', roleId);
        await deleteDoc(roleDocRef);
    } catch (error) {
        console.error("Error deleting role: ", error);
        throw new Error("Falha ao excluir cargo.");
    }
}
