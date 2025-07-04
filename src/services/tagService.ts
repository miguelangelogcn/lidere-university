'use server';

import { db } from '@/lib/firebase';
import type { Tag } from '@/lib/types';
import { collection, getDocs, type DocumentData } from 'firebase/firestore';

function docToTag(doc: DocumentData): Tag {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
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
