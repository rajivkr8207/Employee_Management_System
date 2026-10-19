import nodemailer from 'nodemailer';
import Config from './Config.js';
const MailTranspoter = nodemailer.createTransport({
  host: Config.smtp_host,
  port: Number(Config.smtp_port) || 587,
  secure: Config.smtp_secure === 'true',
  auth: {
    user: Config.smtp_user,
    pass: Config.smtp_pass,
  },
});
export default MailTranspoter;
