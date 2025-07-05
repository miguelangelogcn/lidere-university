'use server';

import { db } from '@/lib/firebase';
import type { Comment, Formation, Lesson, Module, SerializableFormation, SerializableLesson, SerializableModule, SerializableComment } from '@/lib/types';
import { collection, getDocs, type DocumentData, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

function docToSerializableFormation(doc: DocumentData): SerializableFormation {
    const data = doc.data();
    
    const modules: SerializableModule[] = (data.modules || []).map((module: any): SerializableModule => ({
        ...module,
        lessons: (module.lessons || []).map((lesson: any): SerializableLesson => ({
            ...lesson,
            comments: (lesson.comments || []).map((comment: any): SerializableComment => ({
                ...comment,
                createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate().toISOString() : new Date().toISOString(),
            })).sort((a: SerializableComment, b: SerializableComment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        })).sort((a: Lesson, b: Lesson) => a.order - b.order),
    })).sort((a: Module, b: Module) => a.order - b.order);

    return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        modules: modules,
    };
}


export async function getFormations(): Promise<SerializableFormation[]> {
  try {
    const formationsCollection = collection(db, 'formacoes');
    const formationSnapshot = await getDocs(formationsCollection);
    if (formationSnapshot.empty) {
        return [];
    }
    const formationList = formationSnapshot.docs.map(docToSerializableFormation);
    return formationList;
  } catch (error) {
    console.error("Error fetching formations: ", error);
    return [];
  }
}

export async function getFormationById(id: string): Promise<SerializableFormation | null> {
    try {
        const formationDocRef = doc(db, 'formacoes', id);
        const docSnap = await getDoc(formationDocRef);
        if (docSnap.exists()) {
            return docToSerializableFormation(docSnap);
        }
        return null;
    } catch (error) {
        console.error("Error fetching formation by id: ", error);
        return null;
    }
}

export async function createFormation(data: Omit<Formation, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'formacoes'), data);
        return docRef.id;
    } catch (error) {
        console.error("Error creating formation: ", error);
        throw new Error("Falha ao criar formação.");
    }
}

export async function updateFormation(id: string, data: Partial<Omit<Formation, 'id'>>): Promise<void> {
    try {
        const formationDocRef = doc(db, 'formacoes', id);
        await updateDoc(formationDocRef, data);
    } catch (error) {
        console.error("Error updating formation: ", error);
        throw new Error("Falha ao atualizar formação.");
    }
}

export async function deleteFormation(id: string): Promise<void> {
    try {
        const formationDocRef = doc(db, 'formacoes', id);
        await deleteDoc(formationDocRef);
    } catch (error) {
        console.error("Error deleting formation: ", error);
        throw new Error("Falha ao excluir formação.");
    }
}


export async function addCommentToLesson(
    formationId: string, 
    moduleId: string, 
    lessonId: string, 
    commentData: Omit<Comment, 'id' | 'createdAt'>
): Promise<void> {
    const formationDocRef = doc(db, 'formacoes', formationId);
    
    try {
        const formationSnap = await getDoc(formationDocRef);
        if (!formationSnap.exists()) {
            throw new Error("Formação não encontrada.");
        }

        const formation = formationSnap.data() as Omit<Formation, 'id'>;

        const newComment: Comment = {
            ...commentData,
            id: doc(collection(db, '_')).id,
            createdAt: new Date(),
        };

        const newModules = formation.modules.map(m => {
            if (m.id !== moduleId) return m;
            return {
                ...m,
                lessons: m.lessons.map(l => {
                    if (l.id !== lessonId) return l;
                    const existingComments = l.comments || [];
                    return {
                        ...l,
                        comments: [...existingComments, newComment]
                    };
                })
            };
        });

        await updateDoc(formationDocRef, { modules: newModules });

    } catch (error) {
        console.error("Error adding comment to lesson: ", error);
        throw new Error("Falha ao adicionar comentário.");
    }
}
