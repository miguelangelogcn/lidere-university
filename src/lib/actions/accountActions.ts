'use server';

import { db } from "@/lib/firebase";
import type { Account } from "@/lib/types";
import { doc, getDoc, writeBatch, collection } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function markAccountAsPaid(
    type: 'payable' | 'receivable', 
    accountId: string
) {
    const accountCollectionName = type === 'payable' ? 'contas-a-pagar' : 'contas-a-receber';
    const accountDocRef = doc(db, accountCollectionName, accountId);

    const batch = writeBatch(db);

    try {
        const accountSnap = await getDoc(accountDocRef);
        if (!accountSnap.exists()) {
            throw new Error("Conta não encontrada.");
        }
        const accountData = accountSnap.data();

        // Prevent double processing
        if (accountData.status === 'paid') {
            return { success: false, message: 'Esta conta já foi marcada como paga.' };
        }

        // 1. Prepare data for financial record
        const financialRecordRef = doc(collection(db, 'fin-registros'));
        const financialRecordData = {
            description: `${type === 'payable' ? 'Pagamento' : 'Recebimento'} de conta: ${accountData.description}`,
            amount: accountData.amount,
            type: type === 'payable' ? 'expense' : 'income',
            date: new Date(),
            category: accountData.category,
            companyId: accountData.companyId,
            companyName: accountData.companyName,
            createdAt: new Date(),
        };

        // 2. Add financial record to batch
        batch.set(financialRecordRef, financialRecordData);

        // 3. Prepare account update data
        const accountUpdateData = {
            status: 'paid',
            paidAt: new Date(),
        };

        // 4. Add account update to batch
        batch.update(accountDocRef, accountUpdateData);

        // 5. Commit batch
        await batch.commit();

        revalidatePath('/contas');
        revalidatePath('/financeiro');

        return { success: true, message: `Conta marcada como ${type === 'payable' ? 'paga' : 'recebida'} e registro financeiro criado.` };

    } catch (error) {
        console.error("Error marking account as paid:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "Ocorreu um erro desconhecido." };
    }
}
