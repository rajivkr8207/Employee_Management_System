import { jest } from '@jest/globals';

const previousSmtpEnv = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};
process.env.SMTP_HOST = 'smtp.example.test';
process.env.SMTP_USER = 'test-user';
process.env.SMTP_PASS = 'test-password';

const transporter = { verify: jest.fn() };
const nodemailer = { createTransport: jest.fn(() => transporter) };
const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.unstable_mockModule('nodemailer', () => ({ default: nodemailer }));
jest.unstable_mockModule('../src/config/logger.js', () => ({ default: logger }));

const { verifyMailConnection } = await import('../src/config/mail.js');

afterAll(() => {
  for (const [key, value] of Object.entries(previousSmtpEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

beforeEach(() => {
  jest.clearAllMocks();
  transporter.verify.mockResolvedValue(true);
});

describe('SMTP startup verification', () => {
  it('logs when the SMTP server accepts the configured connection', async () => {
    await expect(verifyMailConnection()).resolves.toBe(true);

    expect(transporter.verify).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('[Mail] Connected to SMTP server (smtp.example.test)');
  });

  it('logs SMTP connection errors without blocking application startup', async () => {
    transporter.verify.mockRejectedValueOnce(new Error('SMTP authentication failed'));

    await expect(verifyMailConnection()).resolves.toBe(false);

    expect(logger.error).toHaveBeenCalledWith(
      '[Mail] SMTP connection failed: SMTP authentication failed',
    );
  });
});
