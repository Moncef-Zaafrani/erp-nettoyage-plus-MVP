import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor() {
    const resendApiKey = process.env.RESEND_API_KEY;
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // In development, Resend is optional (we just log to console)
    if (!resendApiKey && isDevelopment) {
      this.logger.log('📧 Email service initialized in DEVELOPMENT mode');
      this.logger.log('💡 Password reset URLs will be logged to console');
      return;
    }

    // In production, Resend API key is required
    if (!resendApiKey) {
      this.logger.error(
        '❌ RESEND_API_KEY not found in environment variables!',
      );
      this.logger.error(
        '💡 Get your free API key at https://resend.com (3,000 emails/month)',
      );
      throw new Error(
        'Email service cannot initialize without RESEND_API_KEY',
      );
    }

    this.resend = new Resend(resendApiKey);
    this.logger.log('✅ Email service initialized with Resend');
    this.logger.log('💡 Using HTTP API - works great with Railway!');
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    const fromEmail = process.env.SMTP_FROM || 'onboarding@resend.dev';
    const fromName = 'NettoyagePlus';
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // In development, just log the reset URL (no email sending)
    if (isDevelopment) {
      this.logger.log('=================================================');
      this.logger.log('📧 PASSWORD RESET EMAIL (Development Mode)');
      this.logger.log('=================================================');
      this.logger.log(`To: ${email}`);
      this.logger.log(`Reset URL: ${resetUrl}`);
      this.logger.log('=================================================');
      this.logger.log('💡 Copy the URL above and paste it in your browser to test');
      return;
    }

    // In production, send via Resend
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: 'Réinitialisation de votre mot de passe - NettoyagePlus',
        html: this.getPasswordResetEmailHtml(resetUrl),
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(
        `✅ Password reset email sent via Resend to ${email}. ID: ${data.id}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send password reset email to ${email}`,
        error.message,
      );
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  private getPasswordResetEmailHtml(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NettoyagePlus</h1>
          </div>
          <div class="content">
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            <p><strong>Ce lien expirera dans 1 heure.</strong></p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>© 2026 NettoyagePlus. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
