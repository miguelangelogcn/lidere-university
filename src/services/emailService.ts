'use server';

import nodemailer from 'nodemailer';

interface EmailPayload {
    to: string;
    subject: string;
    htmlBody: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
        console.error("Variáveis de ambiente SMTP não configuradas. O email não será enviado.");
        // Em um ambiente de produção, você pode querer lançar um erro ou ter uma lógica de fallback.
        // Por enquanto, apenas logamos o erro e retornamos para não quebrar a aplicação.
        return;
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10),
        secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    const mailOptions = {
        from: EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.htmlBody,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email enviado com sucesso para ${payload.to}`);
    } catch (error) {
        console.error(`Erro ao enviar email para ${payload.to}:`, error);
        // Em produção, você pode querer relançar o erro ou lidar com ele de forma mais específica
        throw new Error("Falha ao enviar o email.");
    }
}
