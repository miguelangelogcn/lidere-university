'use server';

import { db, auth } from '@/lib/firebase';
import { collection, addDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { revalidatePath } from 'next/cache';
import { getFormations } from '@/services/formationService';

async function generateUniquePassword() {
    return Math.random().toString(36).slice(-10);
}

export async function importContacts(
    records: any[],
    mappings: Record<string, string>,
    studentConfig: { grantAccess: boolean; expiresAt: string | null }
): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    const contactsCollection = collection(db, 'contacts');

    const allFormations = await getFormations();
    const formationNameMap = new Map(
        allFormations.map(f => [f.title.toLowerCase(), f.id])
    );

    for (const record of records) {
        const contactData: any = {};
        const contactEmail = record[mappings['email']];

        // Basic validation: Check if name and phone exist
        if (!record[mappings['name']] || !record[mappings['phone']]) {
            results.failed++;
            results.errors.push(`Registro ignorado: Nome e Telefone são obrigatórios. (${JSON.stringify(record)})`);
            continue;
        }

        // Map fields
        for (const key in mappings) {
            if (record[mappings[key]]) {
                if (key === 'tags') {
                    contactData[key] = record[mappings[key]].split(',').map((t: string) => t.trim());
                } else if(key !== 'isStudent' && key !== 'formations') {
                    contactData[key] = record[mappings[key]];
                }
            }
        }
        
        const isStudent = studentConfig.grantAccess && String(record[mappings['isStudent']]).toLowerCase() === 'true';

        try {
            // If student, check if auth user already exists
            if (isStudent && contactEmail) {
                const q = query(contactsCollection, where('email', '==', contactEmail), where('studentAccess.userId', '!=', null));
                const existingStudentSnap = await getDocs(q);
                if (!existingStudentSnap.empty) {
                     results.failed++;
                     results.errors.push(`Aluno com email ${contactEmail} já existe e foi ignorado.`);
                     continue; // Skip this record
                }
            }

            // Create contact
            const newContactRef = await addDoc(contactsCollection, contactData);
            
            // Grant student access if applicable
            if (isStudent && contactEmail) {
                try {
                    const password = await generateUniquePassword();
                    const userCredential = await createUserWithEmailAndPassword(auth, contactEmail, password);
                    const user = userCredential.user;

                    const formationNamesCSV = record[mappings['formations']] || '';
                    const formationAccess: { formationId: string, expiresAt: Timestamp | null }[] = [];

                    if (formationNamesCSV) {
                        const formationNames = formationNamesCSV.split(',').map((name: string) => name.trim().toLowerCase());
                        
                        for (const name of formationNames) {
                            const formationId = formationNameMap.get(name);
                            if (formationId) {
                                formationAccess.push({
                                    formationId: formationId,
                                    expiresAt: studentConfig.expiresAt ? Timestamp.fromDate(new Date(studentConfig.expiresAt)) : null,
                                });
                            } else {
                                results.errors.push(`Aviso para ${contactEmail}: Formação '${name}' não encontrada e ignorada.`);
                            }
                        }
                    }

                    await updateDoc(newContactRef, {
                        studentAccess: { userId: user.uid },
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
