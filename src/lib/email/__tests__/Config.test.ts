import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// import { emailConfig as originalEmailConfig } from '../Config';

describe('emailConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use default values if environment variables are not set', async () => {
    delete process.env.EMAIL_FROM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    const { emailConfig } = await import('../Config');

    expect(emailConfig.from).toBe('noreply@example.com');
    expect(emailConfig.smtp.host).toBe('smtp.gmail.com');
    expect(emailConfig.smtp.port).toBe(587);
    expect(emailConfig.smtp.auth.user).toBeUndefined();
    expect(emailConfig.smtp.auth.pass).toBeUndefined();
  });

  it('should use environment variables if they are set', async () => {
    process.env.EMAIL_FROM = 'test@example.com';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASSWORD = 'password';

    const { emailConfig } = await import('../Config');

    expect(emailConfig.from).toBe('test@example.com');
    expect(emailConfig.smtp.host).toBe('smtp.test.com');
    expect(emailConfig.smtp.port).toBe(2525);
    expect(emailConfig.smtp.auth.user).toBe('user');
    expect(emailConfig.smtp.auth.pass).toBe('password');
  });
});
