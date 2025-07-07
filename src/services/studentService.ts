
'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Contact, FormationAccess, Product } from '@/lib/types';
import { getEmailTemplateBySlug } from './emailTemplateService';
import { sendEmail } from './emailService';

async function generateUniquePassword() {
    return Math.random().toString(36).slice(-10);
}

export async function grantStudentAccessFromPurchase(
    contact: Contact,
    product: Product
): Promise<{ success: boolean; message: string, userId?: string }> {
     if (!contact.email) {
        return { success: false, message: 'O contato não possui um email para criar o acesso.' };
    }

    try {
        const password = await generateUniquePassword();
        const userRecord = await adminAuth.createUser({
            email: contact.email,
            password: password,
            displayName: contact.name,
            emailVerified: true,
        });

        const formationAccess: any[] = (contact.formationAccess || []).map(fa => ({
            ...fa,
            expiresAt: fa.expiresAt ? Timestamp.fromDate(new Date(fa.expiresAt)) : null,
        }));
        const addedFormationIds = new Set<string>((contact.formationAccess || []).map(fa => fa.formationId));
        
        if(product.formationIds) {
            for (const formationId of product.formationIds) {
                if (!addedFormationIds.has(formationId)) {
                    let expiresAt: Date | null = null;
                    if (product.contentAccessDays && product.contentAccessDays > 0) {
                        expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + product.contentAccessDays);
                    }
                    formationAccess.push({
                        formationId: formationId,
                        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
                    });
                    addedFormationIds.add(formationId);
                }
            }
        }

        const contactDocRef = adminDb.collection('contacts').doc(contact.id);
        await contactDocRef.update({
            studentAccess: { userId: userRecord.uid },
            formationAccess: formationAccess,
        });
        
        try {
            const template = await getEmailTemplateBySlug('welcome-email');
            if (template) {
                let body = template.body;
                let subject = template.subject;
                const replacements = {
                    '{{name}}': contact.name,
                    '{{email}}': contact.email,
                    '{{password}}': password,
                    '{{loginUrl}}': 'https://vendas-ageis.firebaseapp.com/login' // This should be an env variable
                };
                for (const [key, value] of Object.entries(replacements)) {
                    if(value) {
                            body = body.replace(new RegExp(key, 'g'), value);
                            subject = subject.replace(new RegExp(key, 'g'), value);
                    }
                }
                await sendEmail({ to: contact.email, subject: subject, htmlBody: body });
                return { success: true, message: 'Acesso de aluno criado e email de boas-vindas enviado.', userId: userRecord.uid };
            } else {
                console.warn("Welcome email template ('welcome-email') not found. Skipping email.");
                return { success: true, message: "Acesso criado, mas o template 'welcome-email' não foi encontrado.", userId: userRecord.uid };
            }
        } catch (emailError: any) {
            console.error(`Falha ao enviar email de boas-vindas para ${contact.email}:`, emailError);
            return { success: true, message: `Acesso criado, mas o email falhou. Erro: ${emailError.message}`, userId: userRecord.uid };
        }
    } catch (error: any) {
        console.error("Error granting student access from purchase:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, message: 'Este email já está em uso por outro usuário.' };
        }
        return { success: false, message: 'Falha ao conceder acesso de aluno.' };
    }
}


export async function grantStudentAccess(
    contact: Contact, 
    password: string, 
    formationAccess: { formationId: string, expiresAt: Date | null }[],
    sendWelcomeEmail: boolean
): Promise<{ success: boolean; warning?: string }> {
    if (!contact.email) {
        throw new Error('O contato não possui um email para criar o acesso.');
    }

    try {
        const userRecord = await adminAuth.createUser({
            email: contact.email,
            password: password,
            displayName: contact.name,
            emailVerified: true,
        });

        const accessWithTimestamps = formationAccess.map(access => ({
            ...access,
            expiresAt: access.expiresAt ? Timestamp.fromDate(access.expiresAt) : null,
        }));
        
        const contactDocRef = adminDb.collection('contacts').doc(contact.id);
        await contactDocRef.update({
            studentAccess: { userId: userRecord.uid },
            formationAccess: accessWithTimestamps,
        });

        if (sendWelcomeEmail) {
            try {
                const template = await getEmailTemplateBySlug('welcome-email');
                if (template) {
                    let body = template.body;
                    let subject = template.subject;
                    const replacements = {
                        '{{name}}': contact.name,
                        '{{email}}': contact.email,
                        '{{password}}': password,
                        '{{loginUrl}}': 'https://vendas-ageis.firebaseapp.com/login' // This should be an env variable
                    };
                    for (const [key, value] of Object.entries(replacements)) {
                        if(value) {
                             body = body.replace(new RegExp(key, 'g'), value);
                             subject = subject.replace(new RegExp(key, 'g'), value);
                        }
                    }
                    await sendEmail({ to: contact.email, subject: subject, htmlBody: body });
                } else {
                    console.warn("Welcome email template ('welcome-email') not found. Skipping email.");
                    return { success: true, warning: "O acesso foi criado, mas o template 'welcome-email' não foi encontrado." };
                }
            } catch (emailError: any) {
                console.error(`Falha ao enviar email de boas-vindas para ${contact.email}:`, emailError);
                return { success: true, warning: `O acesso foi criado, mas o email falhou. Verifique as configs de SMTP. Erro: ${emailError.message}` };
            }
        }

        return { success: true };

    } catch (error: any) {
        console.error("Error granting student access:", error);
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Este email já está em uso por outro usuário.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        throw new Error('Falha ao conceder acesso de aluno.');
    }
}

export async function updateStudentAccess(contactId: string, formationAccess: { formationId: string, expiresAt: Date | null }[]): Promise<void> {
    try {
        const contactDocRef = adminDb.collection('contacts').doc(contactId);
        const accessWithTimestamps = formationAccess.map(access => ({
          ...access,
          expiresAt: access.expiresAt ? Timestamp.fromDate(access.expiresAt) : null,
        }));
        await contactDocRef.update({
            formationAccess: accessWithTimestamps
        });
    } catch (error: any) {
        console.error("Error updating student access:", error);
        throw new Error("Falha ao atualizar acesso do aluno.");
    }
}

export async function revokeStudentAccess(contact: Contact): Promise<void> {
    if (!contact.studentAccess?.userId) {
        throw new Error('Este contato não possui um acesso de aluno para ser revogado.');
    }
    
    try {
        const userId = contact.studentAccess.userId;
        const contactDocRef = adminDb.collection('contacts').doc(contact.id);
        
        // Delete from Auth first
        await adminAuth.deleteUser(userId);

        // Then update Firestore
        await contactDocRef.update({
            studentAccess: null,
            formationAccess: [],
        });

    } catch (error: any) {
        console.error("Error revoking student access:", error);
        if (error.code === 'auth/user-not-found') {
            // If user doesn't exist in auth, just clean up firestore
            console.warn(`User ${contact.studentAccess.userId} not found in Auth. Cleaning up Firestore record.`);
            const contactDocRef = adminDb.collection('contacts').doc(contact.id);
            await contactDocRef.update({
                studentAccess: null,
                formationAccess: [],
            });
            return;
        }
        throw new Error(`Falha ao revogar o acesso de aluno: ${error.message}`);
    }
}
