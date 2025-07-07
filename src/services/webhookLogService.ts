
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { WebhookLog, SerializableWebhookLog } from '@/lib/types';
import type { DocumentData, Timestamp } from 'firebase-admin/firestore';

function docToSerializableWebhookLog(doc: DocumentData): SerializableWebhookLog {
    const data = doc.data();
    return {
        id: doc.id,
        payload: data.payload,
        headers: data.headers,
        result: data.result,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    };
}

export async function createWebhookLog(data: Omit<WebhookLog, 'id' | 'createdAt'>): Promise<void> {
    try {
        const logData = {
            ...data,
            createdAt: Timestamp.now(),
        };
        await adminDb.collection('webhookLogs').add(logData);
    } catch (error) {
        // We don't want to throw an error here to not break the main webhook flow
        console.error("CRITICAL: Failed to create webhook log:", error);
    }
}

export async function getWebhookLogs(): Promise<SerializableWebhookLog[]> {
    try {
        const snapshot = await adminDb.collection('webhookLogs').orderBy('createdAt', 'desc').limit(50).get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(docToSerializableWebhookLog);
    } catch (error) {
        console.error("Error fetching webhook logs:", error);
        // Throwing here is acceptable as it's a direct user action
        throw new Error("Falha ao buscar os logs do webhook.");
    }
}
