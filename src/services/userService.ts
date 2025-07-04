'use server';

import { db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import { collection, getDocs, type DocumentData } from 'firebase/firestore';

function docToAppUser(doc: DocumentData): AppUser {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || data.displayName || null,
        email: data.email || null,
        avatarUrl: data.avatarUrl || data.photoURL || null,
        permissions: data.permissions || [],
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
