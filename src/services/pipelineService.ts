'use server';

import { db } from '@/lib/firebase';
import type { Pipeline, PipelineStage } from '@/lib/types';
import { collection, getDocs, type DocumentData, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

function docToPipeline(doc: DocumentData): Pipeline {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
        stages: (data.stages || []).sort((a: PipelineStage, b: PipelineStage) => a.order - b.order),
    };
}

export async function getPipelines(): Promise<Pipeline[]> {
  try {
    const pipelinesCollection = collection(db, 'pipelines');
    const pipelineSnapshot = await getDocs(pipelinesCollection);
    if (pipelineSnapshot.empty) {
        return [];
    }
    const pipelineList = pipelineSnapshot.docs.map(docToPipeline);
    return pipelineList;
  } catch (error) {
    console.error("Error fetching pipelines: ", error);
    return [];
  }
}

export async function createPipeline(data: { name: string; stages: { name: string }[] }): Promise<void> {
    try {
        const pipelineCollection = collection(db, 'pipelines');
        const newPipelineRef = doc(pipelineCollection);

        const stagesWithIds: PipelineStage[] = data.stages.map((stage, index) => ({
            id: doc(collection(db, 'random')).id, // Generate a random id
            name: stage.name,
            order: index,
        }));
        
        await addDoc(collection(db, 'pipelines'), {
            name: data.name,
            stages: stagesWithIds,
        });

    } catch (error) {
        console.error("Error creating pipeline: ", error);
        throw new Error("Falha ao criar funil.");
    }
}


export async function updatePipeline(pipelineId: string, data: { name: string; stages: (Omit<PipelineStage, 'order'> | { name: string })[] }): Promise<void> {
    try {
        const pipelineDocRef = doc(db, 'pipelines', pipelineId);

        const stagesWithIds: PipelineStage[] = data.stages.map((stage, index) => {
            const id = (stage as Omit<PipelineStage, 'order'>).id || doc(collection(db, 'random')).id;
            return {
                id,
                name: stage.name,
                order: index,
            }
        });

        await updateDoc(pipelineDocRef, {
            name: data.name,
            stages: stagesWithIds
        });
    } catch (error) {
        console.error("Error updating pipeline: ", error);
        throw new Error("Falha ao atualizar funil.");
    }
}

export async function deletePipeline(pipelineId: string): Promise<void> {
    try {
        const pipelineDocRef = doc(db, 'pipelines', pipelineId);
        await deleteDoc(pipelineDocRef);
    } catch (error) {
        console.error("Error deleting pipeline: ", error);
        throw new Error("Falha ao excluir funil.");
    }
}
