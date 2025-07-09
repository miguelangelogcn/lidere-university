'use server';

import { createAccount } from "@/services/accountsService";
import { revalidatePath } from "next/cache";

interface TaxPayableData {
    amount: number;
    description: string;
    dueDate: Date;
    companyId: string;
    companyName: string;
}

export async function createTaxPayable(data: TaxPayableData) {
    try {
        await createAccount('payable', {
            ...data,
            category: 'Impostos e Taxas',
            isRecurring: false,
            notes: 'Gerado automaticamente pela funcionalidade de cálculo de impostos.'
        }, false);
        
        revalidatePath('/contas');
        revalidatePath('/impostos');
        
        return { success: true, message: 'Conta de imposto a pagar criada com sucesso!' };

    } catch (error) {
        console.error("Error creating tax payable:", error);
        return { success: false, message: 'Falha ao criar a conta de imposto a pagar.' };
    }
}
