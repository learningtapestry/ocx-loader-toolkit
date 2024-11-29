export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@example.com',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: process.env.SMTP_AUTH === 'true' ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    } : false,
    secure: process.env.SMTP_SECURE === 'true'
  }
}
