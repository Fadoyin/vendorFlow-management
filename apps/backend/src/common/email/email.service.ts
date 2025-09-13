import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private async createTransporter(): Promise<void> {
    try {
      // Try Gmail first (production ready) - with hardcoded fallback for testing
      const gmailUser = this.configService.get<string>('SMTP_GMAIL_USER') || 
                       this.configService.get<string>('SMTP_USER') || 
                       'fadoyintaiwo01@gmail.com'; // Production Gmail account
      const gmailPass = this.configService.get<string>('SMTP_GMAIL_PASS') || 
                       this.configService.get<string>('SMTP_PASS') || 
                       'ldsrvddbcehciqhj'; // Production app password

      if (gmailUser && gmailPass) {
        this.logger.log(`🔧 Configuring Gmail SMTP for ${gmailUser}...`);
        this.transporter = nodemailer.createTransport({
          service: 'gmail', // Use Gmail service for easier configuration
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateLimit: 14, // Max 14 emails per second
        });

        // Verify connection
        await this.transporter.verify();
        this.logger.log(`✅ Gmail SMTP configured successfully for ${gmailUser}`);
        return;
      }

      // Fallback to custom SMTP
      const smtpHost = this.configService.get<string>('SMTP_HOST');
      const smtpUser = this.configService.get<string>('SMTP_USER');
      
      if (smtpHost && smtpUser) {
        this.logger.log('🔧 Configuring custom SMTP...');
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
          secure: this.configService.get<string>('SMTP_SECURE') === 'true',
          auth: {
            user: smtpUser,
            pass: this.configService.get<string>('SMTP_PASS'),
          },
        });

        await this.transporter.verify();
        this.logger.log(`✅ Custom SMTP configured successfully for ${smtpUser}`);
        return;
      }

      throw new Error('No email configuration found');

    } catch (error) {
      this.logger.error('❌ Email service initialization failed:', error.message);
      this.logger.warn('📧 Falling back to development mode (console only)');
      
      // Create a mock transporter for development
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
      });
    }
  }

  async sendOtpEmail(email: string, otp: string, purpose: 'signup' | 'login'): Promise<boolean> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const subject = purpose === 'signup' 
          ? '🔐 Complete Your VendorFlow Registration'
          : '🔐 VendorFlow Login Verification';

        const html = this.generateOtpEmailTemplate(otp, purpose);
        const fromEmail = this.getFromEmail();

        const mailOptions = {
          from: `"${this.configService.get<string>('SMTP_FROM_NAME') || 'VendorFlow'}" <${fromEmail}>`,
          to: email,
          subject: subject,
          html: html,
          text: this.generateOtpTextTemplate(otp, purpose),
        };

        this.logger.log(`📧 Attempting to send email to ${email} via ${this.getProviderName()}`);
        
        const result = await this.transporter.sendMail(mailOptions);
        
        if (result.messageId) {
          this.logger.log(`✅ Email sent successfully: MessageID=${result.messageId}, To=${email}, Provider=${this.getProviderName()}`);
          this.logger.log(`📧 Email details: Subject="${subject}", From="${mailOptions.from}"`);
          return true;
        } else {
          // This is likely the development mock transporter
          this.logger.warn(`🔐 DEVELOPMENT MODE - Email not sent, OTP for ${email} (${purpose}): ${otp}`);
          this.logger.warn(`⚠️ Using mock transporter - no real email delivery`);
          return true; // Return true so the flow continues
        }
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`❌ Attempt ${attempt}/${maxRetries} failed to send OTP email to ${email}: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All attempts failed, log OTP for development
    this.logger.error(`❌ Failed to send email to ${email} after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    this.logger.warn(`🔐 DEVELOPMENT FALLBACK - OTP for ${email} (${purpose}): ${otp}`);
    
    // Return true in development so the flow continues
    return this.configService.get('NODE_ENV') === 'development';
  }

  private getFromEmail(): string {
    return this.configService.get('SMTP_GMAIL_USER') || 
           this.configService.get('SMTP_USER') || 
           'noreply@vendorflow.com';
  }

  private getProviderName(): string {
    const gmailUser = this.configService.get('SMTP_GMAIL_USER');
    if (gmailUser) return 'Gmail';
    
    const smtpHost = this.configService.get('SMTP_HOST');
    if (smtpHost) return `Custom SMTP (${smtpHost})`;
    
    return 'Development Mock';
  }

  private generateOtpTextTemplate(otp: string, purpose: 'signup' | 'login'): string {
    const title = purpose === 'signup' ? 'Welcome to VendorFlow!' : 'VendorFlow Login Verification';
    const message = purpose === 'signup' 
      ? 'Complete your registration by entering the verification code below:'
      : 'Complete your login by entering the verification code below:';

    return `
${title}

${message}

Your verification code is: ${otp}

This code expires in 5 minutes.

Security Notice:
- Never share this code with anyone
- If you didn't request this, please ignore this email

Best regards,
The VendorFlow Team

© 2024 VendorFlow. All rights reserved.
This is an automated message, please do not reply to this email.
    `.trim();
  }

  private generateOtpEmailTemplate(otp: string, purpose: 'signup' | 'login'): string {
    const title = purpose === 'signup' ? 'Welcome to VendorFlow!' : 'VendorFlow Login Verification';
    const message = purpose === 'signup' 
      ? 'Complete your registration by entering the verification code below:'
      : 'Complete your login by entering the verification code below:';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: 'Courier New', monospace; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 ${title}</h1>
          <p>Smart Vendor Management Platform</p>
        </div>
        
        <div class="content">
          <h2>Hello!</h2>
          <p>${message}</p>
          
          <div class="otp-box">
            <p style="margin: 0; font-size: 16px; color: #666;">Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #888;">Valid for 5 minutes</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This code expires in <strong>5 minutes</strong></li>
              <li>Never share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>
          <strong>The VendorFlow Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 VendorFlow. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Email service health check failed:', error.message);
      return false;
    }
  }

  // General email sending method
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      const fromEmail = this.getFromEmail();
      const mailOptions = {
        from: `"${this.configService.get<string>('SMTP_FROM_NAME') || 'VendorFlow'}" <${fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      this.logger.log(`📧 Sending email to ${to} with subject: ${subject}`);
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}:`, error);
      return false;
    }
  }

  // General email sending method
  // Get service info
  getServiceInfo(): { configured: boolean; provider: string } {
    const gmailUser = this.configService.get<string>('SMTP_GMAIL_USER') || this.configService.get<string>('SMTP_USER');
    return {
      configured: !!gmailUser,
      provider: gmailUser ? (gmailUser.includes('gmail.com') ? 'Gmail' : 'Custom SMTP') : 'Development',
    };
  }
}
