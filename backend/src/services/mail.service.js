import Config from '../config/Config.js';
import { getMailTransporter } from '../config/mail.js';

export class MailService {
  constructor() {
    this.hasSmtp = Boolean(Config.smtp_host && Config.smtp_user && Config.smtp_pass);
  }

  async sendMail({ to, subject, text, html }) {
    const transporter = getMailTransporter();

    if (transporter && this.hasSmtp) {
      try {
        const info = await transporter.sendMail({
          from: `"EMS System" <${Config.smtp_user}>`,
          to,
          subject,
          text,
          html: html || `<p>${text}</p>`,
        });
        console.log(`[MailService] Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId, simulated: false };
      } catch (error) {
        console.error(`[MailService Error] Failed to send email to ${to}:`, error.message);
        if (Config.env === 'production') {
          throw error;
        }
        // In development/test, log simulated email rather than crashing the flow
        this.logSimulatedMail({ to, subject, text });
        return { success: true, simulated: true, error: error.message };
      }
    }

    // Fallback development mode: Log email content to console so admin/dev can click links
    this.logSimulatedMail({ to, subject, text });
    return { success: true, simulated: true };
  }

  logSimulatedMail({ to, subject, text }) {
    console.log('\n======================================================');
    console.log('   [MAIL SERVICE (DEVELOPMENT / SIMULATED DISPATCH)]   ');
    console.log('======================================================');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('------------------------------------------------------');
    console.log(text);
    console.log('======================================================\n');
  }

  SendRegisterMail(email, otp, fullName) {
    const text = `Hello ${fullName},\n\nYour account verification code is: ${otp}\nThis code will expire in 10 minutes.\n\nThank you,\nEMS Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">Verify Your Account</h2>
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Use the following verification code to confirm your registration:</p>
        <div style="margin: 24px 0; text-align: center;">
          <span style="display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; background: #eef2ff; color: #4338ca; border-radius: 6px;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This code will expire in 10 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `;
    return this.sendMail({ to: email, subject: 'Verify your account - OTP', text, html });
  }

  SendAgainRegisterMail(email, otp, fullName) {
    return this.SendRegisterMail(email, otp, fullName);
  }

  SendStoreAdminInvitation(email, invitationLink, storeDetails = {}) {
    const storeName = storeDetails.storeName || 'New Store';
    const storeCode = storeDetails.storeCode ? ` (Code: ${storeDetails.storeCode})` : '';

    const text = `Hello,\n\nYou have been invited by the System Administrator to register as the Store Administrator for ${storeName}${storeCode}.\n\nPlease complete your registration within 24 hours using the link below:\n${invitationLink}\n\nThank you,\nEMS Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">Store Administrator Registration Invitation</h2>
        <p>Hello,</p>
        <p>You have been invited by the System Administrator to register and manage <strong>${storeName}</strong>${storeCode}.</p>
        <p>Click the button below to complete your registration and set up your store account:</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${invitationLink}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">Register Store Administrator</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">${invitationLink}</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">This invitation will expire in 24 hours.</p>
      </div>
    `;
    return this.sendMail({
      to: email,
      subject: `Store Administrator Registration Invitation - ${storeName}`,
      text,
      html,
    });
  }

  SendAccountApprovedMail(email, fullName, role = 'Store Administrator', storeName) {
    const storeInfo = storeName ? ` for <strong>${storeName}</strong>` : '';
    const text = `Hello ${fullName},\n\nYour ${role} account${storeName ? ` for ${storeName}` : ''} has been reviewed and APPROVED by the System Administrator.\n\nYou can now log in to access your dashboard.\n\nThank you,\nEMS Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #10b981; margin-bottom: 16px;">Account Approved!</h2>
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Your <strong>${role}</strong> account${storeInfo} has been successfully verified and approved by the System Administrator.</p>
        <p>You now have full access to your store portal.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${Config.frontend_url || 'http://localhost:5173'}/login" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">Log In Now</a>
        </div>
      </div>
    `;
    return this.sendMail({
      to: email,
      subject: `Account Approved - ${role}`,
      text,
      html,
    });
  }

  SendStaffCredentialsMail(email, fullName, role, storeName, temporaryPassword, loginUrl) {
    const text = `Hello ${fullName},\n\nYou have been onboarded as a ${role} at ${storeName}.\n\nYour login credentials are:\nEmail / Username: ${email}\nPassword: ${temporaryPassword}\n\nLogin URL: ${loginUrl}\n\nPlease change your password upon your first login.\n\nThank you,\nEMS Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">Welcome to ${storeName}</h2>
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>You have been onboarded as a <strong>${role}</strong> at <strong>${storeName}</strong>.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Username / Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</code></p>
        </div>
        <p>Please log in using the button below and update your password:</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${loginUrl || `${Config.frontend_url || 'http://localhost:5173'}/login`}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">Log In</a>
        </div>
      </div>
    `;
    return this.sendMail({
      to: email,
      subject: `Your Account Credentials - ${storeName}`,
      text,
      html,
    });
  }
}
