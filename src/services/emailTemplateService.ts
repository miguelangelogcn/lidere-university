'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { EmailTemplate } from '@/lib/types';
import type { DocumentData } from 'firebase-admin/firestore';

function docToEmailTemplate(doc: DocumentData): EmailTemplate {
    const data = doc.data();
    return {
        id: doc.id,
        slug: data.slug,
        name: data.name,
        subject: data.subject,
        body: data.body,
    };
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
    const snapshot = await adminDb.collection('emailTemplates').orderBy('name').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(docToEmailTemplate);
}

export async function getEmailTemplateBySlug(slug: string): Promise<EmailTemplate | null> {
    const snapshot = await adminDb.collection('emailTemplates').where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) return null;
    return docToEmailTemplate(snapshot.docs[0]);
}

export async function createEmailTemplate(data: Omit<EmailTemplate, 'id'>): Promise<void> {
    // Check for unique slug
    const existing = await getEmailTemplateBySlug(data.slug);
    if (existing) {
        throw new Error(`O slug '${data.slug}' já está em uso.`);
    }
    await adminDb.collection('emailTemplates').add(data);
}

export async function updateEmailTemplate(id: string, data: Partial<Omit<EmailTemplate, 'id' | 'slug'>>): Promise<void> {
    await adminDb.collection('emailTemplates').doc(id).update(data);
}

export async function deleteEmailTemplate(id: string): Promise<void> {
    await adminDb.collection('emailTemplates').doc(id).delete();
}
