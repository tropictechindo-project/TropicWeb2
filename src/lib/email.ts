import nodemailer from 'nodemailer'
import { db } from './db'

async function logEmail(to: string, subject: string, html: string, status: string = 'SENT', invoiceId?: string) {
  try {
    const anyDb = db as any;
    await anyDb.emailAudit.create({
      data: {
        to,
        subject,
        body: html,
        status,
        ...(invoiceId && { invoiceId }),
      }
    })
  } catch (error) {
    console.error('Failed to create email audit log:', error)
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendInvoiceEmail(data: {
  to: string | string[],
  invoiceNumber: string,
  customerName: string,
  amount: number,
  invoiceLink: string,
  trackingLink?: string,
  invoiceId?: string,
  isPaid?: boolean
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tropictech.online'
  const trackingUrl = data.trackingLink || `${baseUrl}/tracking/${data.invoiceNumber}`
  
  let customerEmail = ''
  let bcc: string[] = []

  if (Array.isArray(data.to)) {
    if (data.to.length > 0) {
      customerEmail = data.to[0]
      bcc = data.to.slice(1)
    }
  } else {
    customerEmail = data.to
  }

  const statusColor = data.isPaid ? '#34D399' : '#6666FF'
  const statusText = data.isPaid ? 'Payment Confirmed' : 'Invoice Ready'

  const mailOptions = {
    from: `"Tropic Tech" <${process.env.SMTP_FROM || 'contact@tropictech.online'}>`,
    to: customerEmail,
    bcc: bcc,
    subject: `${statusText}: ${data.invoiceNumber} - Tropic Tech International`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; background-color: white;">
        <div style="background-color: ${statusColor}; padding: 48px 24px; text-align: center; color: white;">
          <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px; opacity: 0.8;">Tropic Tech International</div>
          <h1 style="margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">${statusText}</h1>
          <p style="margin: 12px 0 0 0; font-size: 16px; font-weight: 500; opacity: 0.9;">Order #${data.invoiceNumber}</p>
        </div>
        
        <div style="padding: 40px; color: #1E293B; line-height: 1.6;">
          <p style="font-size: 18px; margin-top: 0;">Hello <strong>${data.customerName}</strong>,</p>
          
          ${data.isPaid ? `
            <p style="font-size: 16px;">Great news! Your payment has been confirmed. Our team is now preparing your workstation for delivery. You can track your order status in real-time below.</p>
          ` : `
            <p style="font-size: 16px;">Your invoice for workstation rental is now available. Please complete the payment to confirm your delivery schedule.</p>
          `}
          
          <div style="background-color: #F8FAFC; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #E2E8F0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 14px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Amount Total</span>
            </div>
            <div style="font-size: 28px; font-weight: 900; color: #1E293B;">Rp ${data.amount.toLocaleString('id-ID')}</div>
          </div>

          <div style="margin: 32px 0;">
            ${data.isPaid ? `
              <a href="${trackingUrl}" style="background-color: #0F172A; color: white; padding: 18px 32px; text-decoration: none; border-radius: 10px; font-weight: 800; display: block; text-align: center; font-size: 16px; letter-spacing: 1px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">🚀 TRACK YOUR ORDER LIVE</a>
              <div style="text-align: center; margin-top: 16px;">
                <a href="${data.invoiceLink}" style="color: #64748B; font-size: 14px; font-weight: 600; text-decoration: underline;">View Invoice PDF</a>
              </div>
            ` : `
              <a href="${data.invoiceLink}" style="background-color: #6666FF; color: white; padding: 18px 32px; text-decoration: none; border-radius: 10px; font-weight: 800; display: block; text-align: center; font-size: 16px; letter-spacing: 1px; box-shadow: 0 10px 15px -3px rgba(102, 102, 255, 0.3);">VIEW & PAY INVOICE</a>
            `}
          </div>
          
          <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 40px 0;">
          
          <div style="font-size: 14px; color: #64748B;">
            <p style="margin-bottom: 10px;"><strong>Tropic Tech International Network</strong></p>
            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 8px;">
              <span style="font-size: 12px;">• indonesianvisas.com</span>
              <span style="font-size: 12px;">• balihelp.id</span>
              <span style="font-size: 12px;">• indodesign.website</span>
            </div>
          </div>
        </div>
        
        <div style="background-color: #F8FAFC; padding: 24px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9;">
          &copy; 2026 PT Tropic Tech International. All rights reserved.<br>
          Jl. Tunjungsari No.8, Denpasar, Bali.
        </div>
      </div>
    `,
  }

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`--- DEVELOPMENT MOCK EMAIL (${statusText}) ---`)
      console.log(`To: ${customerEmail}`)
      console.log(`Tracking: ${trackingUrl}`)
      console.log(`Invoice: ${data.invoiceLink}`)
      console.log('--------------------------------------')
      return true
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email (${statusText}) sent to ${customerEmail}`)
    
    await logEmail(customerEmail, mailOptions.subject, mailOptions.html, 'SENT', data.invoiceId)
    return true
  } catch (error: any) {
    console.error('Error sending email:', error)
    await logEmail(customerEmail, mailOptions.subject, mailOptions.html, `FAILED: ${error.message?.slice(0, 40) || 'Unknown'}`, data.invoiceId)
    return false
  }
}

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  const mailOptions = {
    from: `"Tropic Tech Security" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'contact@tropictech.online'}>`,
    to: to,
    subject: `Password Reset Request - Tropic Tech`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #000000; padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; text-transform: uppercase; letter-spacing: 2px;">Security Alert</h1>
          <p style="margin-top: 10px; opacity: 0.9;">Password Reset Request</p>
        </div>
        <div style="padding: 30px; color: #1E293B;">
          <p>Hello,</p>
          <p>We received a request to reset your password for your Tropic Tech account. If you didn't make this request, you can safely ignore this email.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetLink}" style="background-color: #6666FF; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">RESET PASSWORD</a>
          </div>

          <p style="font-size: 12px; color: #64748B;">This link will expire in 1 hour.</p>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
          <p style="font-size: 12px; color: #94A3B8; margin: 0;">Tropic Tech International Security Team</p>
        </div>
      </div>
    `,
  }

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('--- DEVELOPMENT MOCK RESET EMAIL ---')
      console.log(`To: ${to}`)
      console.log(`Link: ${resetLink}`)
      console.log('------------------------------------')
      return true
    }
    await transporter.sendMail(mailOptions)
    await logEmail(to, mailOptions.subject, mailOptions.html, 'SENT')
    return true
  } catch (error) {
    console.error('Error sending reset email:', error)
    await logEmail(to, mailOptions.subject, mailOptions.html, `FAILED: ${(error as any).message?.slice(0, 40) || 'Unknown'}`)
    return false
  }
}

export async function sendVerificationEmail(to: string, verificationLink: string) {
  const mailOptions = {
    from: `"Tropic Tech Registration" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'contact@tropictech.online'}>`,
    to: to,
    subject: `Verify your email address - Tropic Tech`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #34D399; padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; text-transform: uppercase; letter-spacing: 2px;">Welcome Aboard!</h1>
          <p style="margin-top: 10px; opacity: 0.9;">Please verify your email address</p>
        </div>
        <div style="padding: 30px; color: #1E293B;">
          <p>Hello,</p>
          <p>Thank you for registering with Tropic Tech! To complete your registration and gain access to your account, please click the button below to verify your email address.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${verificationLink}" style="background-color: #34D399; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">VERIFY EMAIL</a>
          </div>

          <p style="text-align: center; font-size: 12px; color: #64748B;">
             Or copy this link: <br>
             <a href="${verificationLink}" style="color: #34D399;">${verificationLink}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
          <p style="font-size: 12px; color: #94A3B8; margin: 0;">Tropic Tech International Team</p>
        </div>
      </div>
    `,
  }

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('--- DEVELOPMENT MOCK VERIFICATION EMAIL ---')
      console.log(`To: ${to}`)
      console.log(`Link: ${verificationLink}`)
      console.log('-------------------------------------------')
      return true
    }
    await transporter.sendMail(mailOptions)
    await logEmail(to, mailOptions.subject, mailOptions.html, 'SENT')
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    await logEmail(to, mailOptions.subject, mailOptions.html, `FAILED: ${(error as any).message?.slice(0, 40) || 'Unknown'}`)
    return false
  }
}

export async function sendEmail(data: {
  to: string,
  subject: string,
  html: string
}) {
  const mailOptions = {
    from: `"Tropic Tech Contact" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'contact@tropictech.online'}>`,
    to: data.to,
    subject: data.subject,
    html: data.html,
  }

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('--- DEVELOPMENT MOCK CONTACT EMAIL ---')
      console.log(`To: ${data.to}`)
      console.log(`Subject: ${data.subject}`)
      console.log('------------------------------------')
      return true
    }
    await transporter.sendMail(mailOptions)
    await logEmail(data.to, mailOptions.subject, mailOptions.html, 'SENT')
    return true
  } catch (error) {
    console.error('Error sending generic email:', error)
    await logEmail(data.to, mailOptions.subject, mailOptions.html, `FAILED: ${(error as any).message?.slice(0, 40) || 'Unknown'}`)
    return false
  }
}
