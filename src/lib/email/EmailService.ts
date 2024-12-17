import nodemailer from 'nodemailer'
import { EmailPayload } from './Types'
import { emailConfig } from './Config'

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig.smtp)
  }

  async sendEmail({ to, subject, body }: EmailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: emailConfig.from,
        to,
        subject,
        text: body
      })
    } catch (error) {
      console.error('Failed to send email:', error)
      throw new Error('Email sending failed')
    }
  }
}

export const emailService = new EmailService()
export const sendEmail = (payload: EmailPayload) => emailService.sendEmail(payload)
