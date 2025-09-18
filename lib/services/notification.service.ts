// lib/services/notification.service.ts
import { prisma } from '@/lib/prisma';

export interface NotificationService {
  sendRfpInvitation(params: RfpInvitationParams): Promise<void>;
  sendBidConfirmation(params: BidConfirmationParams): Promise<void>;
  sendAwardNotice(params: AwardNoticeParams): Promise<void>;
  sendReminderNotice(params: ReminderParams): Promise<void>;
}

interface RfpInvitationParams {
  vendorEmail: string;
  vendorName: string;
  rfpTitle: string;
  dueDate: Date;
  portalUrl: string;
  projectName: string;
}

interface BidConfirmationParams {
  vendorEmail: string;
  vendorName: string;
  rfpTitle: string;
  bidAmount: string;
  submittedAt: Date;
}

interface AwardNoticeParams {
  vendorEmail: string;
  vendorName: string;
  rfpTitle: string;
  awardAmount: string;
  nextSteps: string;
}

interface ReminderParams {
  vendorEmail: string;
  vendorName: string;
  rfpTitle: string;
  dueDate: Date;
  portalUrl: string;
}

// Email templates
const templates = {
  rfpInvitation: (params: RfpInvitationParams) => ({
    subject: `Invitation to Bid: ${params.rfpTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">You're Invited to Submit a Bid</h1>
          </div>
          <div class="content">
            <p>Dear ${params.vendorName},</p>
            <p>You have been invited to submit a bid for the following project:</p>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #333;">${params.rfpTitle}</h3>
              <p><strong>Project:</strong> ${params.projectName}</p>
              <p><strong>Due Date:</strong> ${params.dueDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${params.portalUrl}" class="button">Submit Your Bid</a>
            </p>

            <div class="footer">
              <p><strong>Important Notes:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please review all RFP documents carefully before submitting</li>
                <li>All bids must be submitted before the deadline</li>
                <li>Late submissions will not be accepted</li>
                <li>For questions, please contact the project team</li>
              </ul>
              <p style="margin-top: 20px;">Best regards,<br>The Project Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  bidConfirmation: (params: BidConfirmationParams) => ({
    subject: `Bid Received: ${params.rfpTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 6px; font-weight: 600; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">✓ Bid Successfully Received</h1>
          </div>
          <div class="content">
            <p>Dear ${params.vendorName},</p>
            <p>We have successfully received your bid submission.</p>

            <div class="info-box">
              <p class="success-badge">CONFIRMED</p>
              <h3 style="margin-top: 10px; color: #333;">${params.rfpTitle}</h3>
              <p><strong>Bid Amount:</strong> ${params.bidAmount}</p>
              <p><strong>Submitted:</strong> ${params.submittedAt.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}</p>
            </div>

            <div class="footer">
              <p><strong>What happens next?</strong></p>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>All bids will be reviewed after the submission deadline</li>
                <li>We may contact you if clarifications are needed</li>
                <li>Award decisions will be communicated to all bidders</li>
                <li>Selected vendor will receive contract documents</li>
              </ol>
              <p style="margin-top: 20px;">Thank you for your participation.</p>
              <p>Best regards,<br>The Project Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  awardNotice: (params: AwardNoticeParams) => ({
    subject: `🎉 Congratulations! Award Notice: ${params.rfpTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
          .award-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 18px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #fbbf24; }
          .next-steps { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🏆 Congratulations!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.95;">Your Bid Has Been Selected</p>
          </div>
          <div class="content">
            <p>Dear ${params.vendorName},</p>
            <p>We are pleased to inform you that your bid has been selected for:</p>

            <div class="info-box">
              <p class="award-badge">AWARDED</p>
              <h3 style="margin-top: 10px; color: #333;">${params.rfpTitle}</h3>
              <p style="font-size: 20px; color: #16a34a; font-weight: 600;">Award Amount: ${params.awardAmount}</p>
            </div>

            <div class="next-steps">
              <h3 style="margin-top: 0; color: #1e40af;">Next Steps:</h3>
              ${params.nextSteps}
            </div>

            <div class="footer">
              <p><strong>Important Information:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Contract documents will be sent separately</li>
                <li>Please review and sign within 5 business days</li>
                <li>Insurance and bonding requirements must be met before work begins</li>
                <li>A kick-off meeting will be scheduled shortly</li>
              </ul>
              <p style="margin-top: 20px;">We look forward to working with you on this project.</p>
              <p>Best regards,<br>The Project Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  reminder: (params: ReminderParams) => ({
    subject: `⏰ Reminder: Bid Due Soon - ${params.rfpTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
          .urgent-badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 6px; font-weight: 600; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ef4444; }
          .button { display: inline-block; padding: 14px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">⏰ Bid Submission Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${params.vendorName},</p>
            <p>This is a friendly reminder that your bid submission deadline is approaching.</p>

            <div class="info-box">
              <p class="urgent-badge">DUE SOON</p>
              <h3 style="margin-top: 10px; color: #333;">${params.rfpTitle}</h3>
              <p style="font-size: 18px; color: #ef4444; font-weight: 600;">
                Due: ${params.dueDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${params.portalUrl}" class="button">Submit Your Bid Now</a>
            </p>

            <div class="footer">
              <p><strong>Don't miss out!</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Late submissions will not be accepted</li>
                <li>Ensure all required documents are included</li>
                <li>Double-check your pricing and calculations</li>
                <li>Contact us if you have any questions</li>
              </ul>
              <p style="margin-top: 20px;">Best regards,<br>The Project Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Resend implementation
export class ResendNotificationService implements NotificationService {
  private resend: any;

  constructor() {
    // Initialize Resend if API key is available
    if (process.env.RESEND_API_KEY) {
      // Dynamic import to avoid build errors if not installed
      import('resend').then(({ Resend }) => {
        this.resend = new Resend(process.env.RESEND_API_KEY);
      }).catch(() => {
        console.log('Resend package not installed, using console logging for emails');
      });
    }
  }

  async sendRfpInvitation(params: RfpInvitationParams): Promise<void> {
    const template = templates.rfpInvitation(params);
    await this.sendEmail(params.vendorEmail, template);
    await this.logNotification('RFP_INVITATION', params.vendorEmail, template.subject);
  }

  async sendBidConfirmation(params: BidConfirmationParams): Promise<void> {
    const template = templates.bidConfirmation(params);
    await this.sendEmail(params.vendorEmail, template);
    await this.logNotification('BID_CONFIRMATION', params.vendorEmail, template.subject);
  }

  async sendAwardNotice(params: AwardNoticeParams): Promise<void> {
    const template = templates.awardNotice(params);
    await this.sendEmail(params.vendorEmail, template);
    await this.logNotification('AWARD_NOTICE', params.vendorEmail, template.subject);
  }

  async sendReminderNotice(params: ReminderParams): Promise<void> {
    const template = templates.reminder(params);
    await this.sendEmail(params.vendorEmail, template);
    await this.logNotification('REMINDER', params.vendorEmail, template.subject);
  }

  private async sendEmail(to: string, template: { subject: string; html: string }) {
    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@construction.app',
          to,
          subject: template.subject,
          html: template.html
        });
      } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
      }
    } else {
      // Log email for development
      console.log('=== Email Would Be Sent ===');
      console.log('To:', to);
      console.log('Subject:', template.subject);
      console.log('Preview: Email template ready for sending');
      console.log('===========================');
    }
  }

  private async logNotification(type: string, recipient: string, subject: string) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: 'system',
          action: 'NOTIFICATION_SENT',
          entity: 'EMAIL',
          entityId: type,
          meta: {
            recipient,
            subject,
            timestamp: new Date().toISOString(),
            type
          }
        }
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }
}

// No-op implementation for testing
export class NoOpNotificationService implements NotificationService {
  async sendRfpInvitation(params: RfpInvitationParams): Promise<void> {
    console.log('Mock: RFP Invitation would be sent to', params.vendorEmail);
  }

  async sendBidConfirmation(params: BidConfirmationParams): Promise<void> {
    console.log('Mock: Bid Confirmation would be sent to', params.vendorEmail);
  }

  async sendAwardNotice(params: AwardNoticeParams): Promise<void> {
    console.log('Mock: Award Notice would be sent to', params.vendorEmail);
  }

  async sendReminderNotice(params: ReminderParams): Promise<void> {
    console.log('Mock: Reminder would be sent to', params.vendorEmail);
  }
}

// Factory to create appropriate service
export function createNotificationService(): NotificationService {
  if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
    return new ResendNotificationService();
  }
  return new NoOpNotificationService();
}