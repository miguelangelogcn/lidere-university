
'use server';

import { getPaidReceivablesForPeriod, createAccount } from "@/services/accountsService";
import { startOfMonth, endOfMonth } from 'date-fns';
import { revalidatePath } from 'next/cache';

export async function calculateTaxForPeriod(companyId: string, year: number, month: number) {
    if (!companyId || !year || !month) {
        return { success: false, message: 'Parâmetros inválidos.', taxAmount: 0 };
    }
    
    try {
        const startDate = startOfMonth(new Date(year, month - 1, 1));
        const endDate = endOfMonth(new Date(year, month - 1, 1));
        
        const paidReceivables = await getPaidReceivablesForPeriod(companyId, startDate, endDate);
        
        if (paidReceivables.length === 0) {
            return { success: true, message: 'Nenhuma receita encontrada para o período.', taxAmount: 0 };
        }

        const totalTax = paidReceivables.reduce((acc, r) => {
            const tax = r.taxRate ? (r.amount * r.taxRate) / 100 : 0;
            return acc + tax;
        }, 0);

        return { success: true, taxAmount: totalTax, message: 'Cálculo realizado.' };

    } catch (error) {
        console.error("Error calculating tax for period:", error);
        const message = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        return { success: false, message, taxAmount: 0 };
    }
}

export async function createTaxPayable(data: {
    description: string;
    dueDate: Date;
    amount: number;
    companyId: string;
    companyName: string;
}) {
    try {
        await createAccount('payable', {
            ...data,
            category: 'Impostos e Taxas',
            isRecurring: false,
        }, false);

        revalidatePath('/contas');

        return { success: true, message: 'Conta de imposto gerada com sucesso!' };

    } catch (error) {
        console.error('Error creating tax payable account:', error);
        const message = error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao gerar a conta de imposto.";
        return { success: false, message };
    }
}
