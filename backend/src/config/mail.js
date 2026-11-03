import nodemailer from 'nodemailer';
import Config from './Config.js';

let cachedTransporter = null;

export const getMailTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  if (Config.smtp_host && Config.smtp_user && Config.smtp_pass) {
    cachedTransporter = nodemailer.createTransport({
      host: Config.smtp_host,
      port: Number(Config.smtp_port) || 587,
      secure: Config.smtp_secure,
      auth: {
        user: Config.smtp_user,
        pass: Config.smtp_pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return cachedTransporter;
  }

  return null;
};

export default getMailTransporter;
