
import { NextResponse } from 'next/server';
import { processWebhookPurchase } from '@/lib/actions/webhookActions';
import { z } from 'zod';

const webhookPayloadSchema = z.object({
    name: z.string().min(1, { message: 'O nome é obrigatório.' }),
    email: z.string().email({ message: 'Email inválido.' }),
    phone: z.string().min(1, { message: 'O telefone é obrigatório.' }),
    productName: z.string().min(1, { message: 'O nome do produto é obrigatório.' }),
});

export async function POST(req: Request) {
    const apiKey = req.headers.get('X-API-Key');

    if (apiKey !== process.env.WEBHOOK_API_KEY) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validation = webhookPayloadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Payload inválido.', details: validation.error.flatten() }, { status: 400 });
        }

        const result = await processWebhookPurchase(validation.data);

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }
        
        return NextResponse.json({ message: 'Webhook processado com sucesso.', data: result.data });

    } catch (error) {
        console.error('Erro no webhook:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Ocorreu um erro interno.' }, { status: 500 });
    }
}
