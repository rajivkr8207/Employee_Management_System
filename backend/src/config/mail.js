import nodemailer from 'nodemailer';
import Config from './config.js';
import logger from './logger.js';

let cachedTransporter = null;

export const getMailTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  if (Config.smtp_host && Config.smtp_user && Config.smtp_pass) {
    cachedTransporter = nodemailer.createTransport({
      host: Config.smtp_host,
      port: 587,
      secure: false,

      auth: {
        user: Config.smtp_user,
        pass: Config.smtp_pass,
      },
      requireTLS: true,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,

      tls: {
        minVersion: 'TLSv1.2',
      },
    });

    return cachedTransporter;
  }

  return null;
};

export const verifyMailConnection = async () => {
  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      logger.warn('[Mail] SMTP is not configured; email will use simulated mode');
      return false;
    }
    await transporter.verify();
    logger.info(`[Mail] Connected to SMTP server (${Config.smtp_host})`);
    return true;
  } catch (error) {
    logger.error(`[Mail] SMTP connection failed: ${error.message}`);
    return false;
  }
};

export default getMailTransporter;
