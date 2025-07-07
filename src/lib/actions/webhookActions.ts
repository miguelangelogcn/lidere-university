
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getProductByName } from '@/services/productService';
import { createContact, getContactByEmail, updateContact } from '@/services/contactService';
import { grantStudentAccessFromPurchase } from '@/services/studentService';
import type { Contact } from '../types';

interface WebhookPayload {
    name: string;
    email: string;
    phone: string;
    productName: string;
}

export async function processWebhookPurchase(payload: WebhookPayload) {
    const { name, email, phone, productName } = payload;

    try {
        // 1. Find Product
        const product = await getProductByName(productName);
        if (!product) {
            throw new Error(`Produto "${productName}" não encontrado.`);
        }

        // 2. Find or Create Contact
        let contact: Contact | null = await getContactByEmail(email);
        let isNewContact = false;
        
        if (!contact) {
            const newContactId = await createContact({ name, email, phone, tags: ['lead', 'cliente'] });
            const contactDoc = await adminDb.collection('contacts').doc(newContactId).get();
            contact = { id: contactDoc.id, ...contactDoc.data() } as Contact;
            isNewContact = true;
        } else {
            // Optionally update contact info if it differs
            if (contact.name !== name || contact.phone !== phone) {
                await updateContact(contact.id, { name, phone });
                contact.name = name;
                contact.phone = phone;
            }
        }
        
        // 3. Grant Student Access if not already a student
        let accessResult;
        if (!contact.studentAccess?.userId) {
            accessResult = await grantStudentAccessFromPurchase(contact, product);
        } else {
             // Logic to handle existing students buying new products can be added here
             // For now, we'll just return a success message assuming access is cumulative
             console.log(`Contato ${email} já é um aluno. Lógica para adicionar novo produto pode ser implementada aqui.`);
             accessResult = { success: true, message: 'Aluno já existente. Acesso verificado.' };
        }

        if (!accessResult.success) {
             throw new Error(accessResult.message || "Falha ao conceder acesso de aluno.");
        }

        return {
            success: true,
            data: {
                contactId: contact.id,
                isNewContact: isNewContact,
                userId: contact.studentAccess?.userId || accessResult.userId,
                message: accessResult.message,
            }
        };

    } catch (error) {
        console.error('Falha ao processar webhook de compra:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return { success: false, message: errorMessage };
    }
}
