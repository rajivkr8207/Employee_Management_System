import Config from '../config/Config.js';
import { ApiError } from '../utils/ApiError.js';
import MailTranspoter from '../config/mail.js';

export class MailService {
  constructor() {
    if (!Config.smtp_host || !Config.smtp_user || !Config.smtp_pass) {
      throw new ApiError(503, 'Email service is not configured');
    }
  }

  async sendMail(to, subject, text) {
    try {
      await MailTranspoter.sendMail({
        from: Config.smtp_user,
        to,
        subject,
        text,
      });
      return true;
    } catch {
      throw new ApiError(502, 'Failed to send email');
    }
  }

  SendRegisterMail(email, otp, fullName) {
    return this.sendMail(
      email,
      'Verify your account',
      `Hello ${fullName}, your verification code is ${otp}. It expires in 10 minutes.`,
    );
  }

  SendAgainRegisterMail(email, otp, fullName) {
    return this.SendRegisterMail(email, otp, fullName);
  }

  SendStoreAdminInvitation(email, invitationLink) {
    return this.sendMail(
      email,
      'Store administrator registration invitation',
      `You have been invited to register as a store administrator. Complete registration within 24 hours: ${invitationLink}`,
    );
  }
}
