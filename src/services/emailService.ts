'use server';

interface EmailPayload {
    to: string;
    subject: string;
    htmlBody: string;
}

/**
 * Sends an email.
 * NOTE: This is a placeholder implementation. In a real production environment,
 * this function would integrate with an email sending service like SendGrid,
 * Amazon SES, or Mailgun, and use an API key from environment variables.
 * @param payload - The email details.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
    console.log("--- SIMULATING EMAIL SEND ---");
    console.log(`To: ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log("Body (HTML):");
    console.log(payload.htmlBody);
    console.log("--- END OF SIMULATION ---");
    
    // In a real implementation, you would have something like:
    //
    // const sendgrid = require('@sendgrid/mail');
    // sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    // const msg = {
    //   to: payload.to,
    //   from: 'no-reply@lidereuniversity.com',
    //   subject: payload.subject,
    //   html: payload.htmlBody,
    // };
    // await sendgrid.send(msg);
    
    // For now, we just resolve the promise to simulate a successful send.
    return Promise.resolve();
}
