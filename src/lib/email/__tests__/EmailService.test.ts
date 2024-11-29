import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailService, emailService, sendEmail } from '../EmailService'
import nodemailer from 'nodemailer'

// Mock nodemailer first
vi.mock('nodemailer', () => {
  const mockSendMail = vi.fn().mockResolvedValue({})
  return {
    default: {
      createTransport: vi.fn(() => ({
        sendMail: mockSendMail
      }))
    }
  }
})

describe('EmailService', () => {
  const mockPayload = {
    to: 'test@example.com',
    subject: 'Test Subject',
    body: 'Test Body'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendEmail', () => {
    it('should send an email with the correct parameters', async () => {
      const service = new EmailService()
      await service.sendEmail(mockPayload)
      
      const mockTransport = nodemailer.createTransport()
      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: mockPayload.to,
        subject: mockPayload.subject,
        text: mockPayload.body
      })
    })

    it('should throw an error if sending email fails', async () => {
      const mockTransport = nodemailer.createTransport()
      vi.mocked(mockTransport.sendMail).mockRejectedValueOnce(new Error('Send failed'))
      const service = new EmailService()

      await expect(service.sendEmail(mockPayload)).rejects.toThrow('Email sending failed')
    })
  })

  describe('sendEmail function', () => {
    it('should call emailService.sendEmail with the correct payload', async () => {
      const spy = vi.spyOn(emailService, 'sendEmail')
      await sendEmail(mockPayload)
      expect(spy).toHaveBeenCalledWith(mockPayload)
    })
  })
})
