
import { NextResponse } from 'next/server';
import { processWebhookPurchase } from '@/lib/actions/webhookActions';
import { createWebhookLog } from '@/services/webhookLogService';
import { z } from 'zod';

const webhookPayloadSchema = z.object({
    name: z.string().min(1, { message: 'O nome é obrigatório.' }),
    email: z.string().email({ message: 'Email inválido.' }),
    phone: z.string().min(1, { message: 'O telefone é obrigatório.' }),
    productName: z.string().min(1, { message: 'O nome do produto é obrigatório.' }),
});

export async function POST(req: Request) {
    const apiKey = req.headers.get('X-API-Key');
    let body;

    try {
        body = await req.json();
    } catch (e) {
        // Log the invalid request attempt
        await createWebhookLog({
            payload: { error: 'Invalid JSON payload' },
            headers: { 'X-API-Key': apiKey ? 'present' : 'missing' },
            result: { success: false, message: 'Payload JSON inválido.' }
        });
        return NextResponse.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }

    if (apiKey !== process.env.WEBHOOK_API_KEY) {
        await createWebhookLog({
            payload: body,
            headers: { 'X-API-Key': 'invalid_or_missing' },
            result: { success: false, message: 'Não autorizado.' }
        });
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const validation = webhookPayloadSchema.safeParse(body);

        if (!validation.success) {
            const errorDetails = validation.error.flatten();
            await createWebhookLog({
                payload: body,
                headers: { 'X-API-Key': 'present' },
                result: { success: false, message: 'Payload inválido.', details: errorDetails }
            });
            return NextResponse.json({ error: 'Payload inválido.', details: errorDetails }, { status: 400 });
        }

        const result = await processWebhookPurchase(validation.data);

        await createWebhookLog({
            payload: validation.data,
            headers: { 'X-API-Key': 'present' },
            result: result
        });

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }
        
        return NextResponse.json({ message: 'Webhook processado com sucesso.', data: result.data });

    } catch (error) {
        console.error('Erro no webhook:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro interno.';
        
        await createWebhookLog({
            payload: body,
            headers: { 'X-API-Key': 'present' },
            result: { success: false, message: errorMessage }
        });
        
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
