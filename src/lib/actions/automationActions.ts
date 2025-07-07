'use server';

export async function testWebhook(payload: { name: string; email: string; phone: string; productName: string; }) {
    const webhookUrl = process.env.NEXT_PUBLIC_BASE_URL
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`
        : `http://localhost:${process.env.PORT || 3000}/api/webhook`; // Fallback for local dev

    const apiKey = process.env.WEBHOOK_API_KEY;

    if (!apiKey) {
        return { success: false, message: 'A variável WEBHOOK_API_KEY não está configurada no servidor.' };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
            cache: 'no-store', // Ensure it always hits the server
        });

        const result = await response.json();
        
        if (!response.ok) {
            return { success: false, message: `Erro da API: ${result.error || response.statusText}`, data: result };
        }
        
        return { success: true, message: 'Webhook enviado com sucesso!', data: result };

    } catch (error) {
        console.error('Erro ao testar webhook:', error);
        if (error instanceof TypeError && error.message.includes('fetch failed')) {
             return { success: false, message: `Falha de conexão com o endpoint do webhook em ${webhookUrl}. Verifique se o servidor está rodando e acessível.` };
        }
        return { success: false, message: 'Falha ao conectar com o endpoint do webhook.' };
    }
}
