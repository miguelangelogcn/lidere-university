'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { getProducts } from '@/services/productService';
import type { Product } from '@/lib/types';
import { generateWelcomeEmail } from '@/ai/flows/generate-welcome-email-flow';
import { sendEmail } from '@/services/emailService';


async function generateUniquePassword() {
    return Math.random().toString(36).slice(-10);
}

export async function importContacts(
    records: any[],
    mappings: Record<string, string>,
    studentConfig: { grantAccess: boolean; }
): Promise<{ success: number; failed: number; errors: string[] }> {
    if (!adminDb || !adminAuth) {
        throw new Error('Firebase Admin SDK não foi inicializado corretamente.');
    }
    
    const results = { success: 0, failed: 0, errors: [] as string[] };
    const contactsCollection = adminDb.collection('contacts');

    const allProducts = await getProducts();
    const productNameMap = new Map<string, Product>(
        allProducts.map(p => [p.name.toLowerCase(), p])
    );

    for (const record of records) {
        const contactData: any = {};
        const contactEmail = record[mappings['email']];

        if (!record[mappings['name']] || !record[mappings['phone']]) {
            results.failed++;
            results.errors.push(`Registro ignorado: Nome e Telefone são obrigatórios. (${JSON.stringify(record)})`);
            continue;
        }

        for (const key in mappings) {
            if (record[mappings[key]]) {
                if (key === 'tags') {
                    contactData[key] = record[mappings[key]].split(',').map((t: string) => t.trim());
                } else if(key !== 'isStudent' && key !== 'products' && key !== 'entryDate') {
                    contactData[key] = record[mappings[key]];
                }
            }
        }
        
        const isStudent = studentConfig.grantAccess && String(record[mappings['isStudent']]).toLowerCase() === 'true';

        try {
            if (isStudent && contactEmail) {
                const q = contactsCollection.where('email', '==', contactEmail).where('studentAccess.userId', '!=', null);
                const existingStudentSnap = await q.get();
                if (!existingStudentSnap.empty) {
                     results.failed++;
                     results.errors.push(`Aluno com email ${contactEmail} já existe e foi ignorado.`);
                     continue;
                }
            }

            const newContactRef = await contactsCollection.add(contactData);
            
            if (isStudent && contactEmail) {
                try {
                    const password = await generateUniquePassword();
                    const userRecord = await adminAuth.createUser({
                        email: contactEmail,
                        password: password,
                        displayName: contactData.name,
                        emailVerified: true
                    });

                    // Send welcome email
                    try {
                        const emailContent = await generateWelcomeEmail({
                            name: contactData.name,
                            email: contactEmail,
                            password: password,
                            loginUrl: 'https://seusite.com/login' // TODO: Replace with actual URL
                        });

                        await sendEmail({
                            to: contactEmail,
                            subject: emailContent.subject,
                            htmlBody: emailContent.body,
                        });
                    } catch (emailError) {
                        console.error(`Falha ao enviar email para ${contactEmail}:`, emailError);
                        results.errors.push(`Aviso para ${contactEmail}: O contato foi criado, mas o email de boas-vindas falhou.`);
                    }


                    const productNamesCSV = record[mappings['products']] || '';
                    const formationAccess: any[] = [];
                    const addedFormationIds = new Set<string>();

                    const entryDateStr = record[mappings['entryDate']];
                    let baseDate = new Date(); // Default to today
                    if (entryDateStr) {
                        const parsedDate = new Date(entryDateStr + 'T00:00:00');
                        if (!isNaN(parsedDate.getTime())) {
                            baseDate = parsedDate;
                        }
                    }

                    if (productNamesCSV) {
                        const productNames = productNamesCSV.split(',').map((name: string) => name.trim().toLowerCase());
                        
                        for (const name of productNames) {
                            const product = productNameMap.get(name);
                            if (product && product.formationIds) {
                                for (const formationId of product.formationIds) {
                                    if (!addedFormationIds.has(formationId)) {
                                        let expiresAt: Date | null = null;
                                        if (product.contentAccessDays && product.contentAccessDays > 0) {
                                            expiresAt = new Date(baseDate);
                                            expiresAt.setDate(expiresAt.getDate() + product.contentAccessDays);
                                        }
                                        
                                        formationAccess.push({
                                            formationId: formationId,
                                            expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
                                        });
                                        addedFormationIds.add(formationId);
                                    }
                                }
                            } else if (!product) {
                                results.errors.push(`Aviso para ${contactEmail}: Produto '${name}' não encontrado e ignorado.`);
                            }
                        }
                    }

                    await newContactRef.update({
                        studentAccess: { userId: userRecord.uid },
                        formationAccess: formationAccess,
                    });

                } catch (authError: any) {
                     throw new Error(`Falha ao criar usuário de autenticação para ${contactEmail}: ${authError.code}`);
                }
            }
            results.success++;
        } catch (error: any) {
            results.failed++;
            results.errors.push(`Falha ao importar '${contactData.name || contactEmail}': ${error.message}`);
        }
    }

    if (results.success > 0) {
        revalidatePath('/contacts');
        revalidatePath('/gerenciar-alunos');
    }

    return results;
}
