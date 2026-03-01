import nodemailer from 'nodemailer'

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
  invoiceLink: string
}) {
  // If 'to' is an array, assuming first one is customer, rest are team
  // This is a simplification based on how getInvoiceRecipients works
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

  const mailOptions = {
    from: `"Tropic Tech Invoices" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'contact@tropictech.online'}>`,
    to: customerEmail,
    bcc: bcc,
    subject: `Invoice ${data.invoiceNumber} - Tropic Tech International`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #6666FF; padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; text-transform: uppercase; letter-spacing: 2px;">Invoice Ready</h1>
          <p style="margin-top: 10px; opacity: 0.9;">${data.invoiceNumber}</p>
        </div>
        <div style="padding: 30px; color: #1E293B;">
          <p>Hello <strong>${data.customerName}</strong>,</p>
          <p>Your invoice for workstation rental is now available. You can view, download, and manage your invoice through our secure portal.</p>
          
          <div style="background-color: #F8FAFC; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px dashed #CBD5E1;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748B;">Amount Due:</span>
                <span style="font-weight: bold; color: #6666FF;">Rp ${data.amount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${data.invoiceLink}" style="background-color: #6666FF; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(102, 102, 255, 0.2);">VIEW & DOWNLOAD INVOICE</a>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #64748B;">
             Or copy this link: <br>
             <a href="${data.invoiceLink}" style="color: #6666FF;">${data.invoiceLink}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #64748B; margin-bottom: 5px;"><strong>Tropic Tech International Network</strong></p>
          <p style="font-size: 12px; color: #94A3B8; margin: 0;">indonesianvisas.com (Visa Services)</p>
          <p style="font-size: 12px; color: #94A3B8; margin: 0;">balihelp.id (Company Formation)</p>
          <p style="font-size: 12px; color: #94A3B8; margin: 0;">indodesign.website (Website Developer)</p>
        </div>
        <div style="background-color: #F1F5F9; padding: 20px; text-align: center; font-size: 12px; color: #64748B;">
          &copy; 2026 PT Tropic Tech International. Jl. Tunjungsari No.8, Bali.
        </div>
      </div>
    `,
  }

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('--- DEVELOPMENT MOCK INVOICE EMAIL ---')
      console.log(`To: ${customerEmail}`)
      console.log(`BCC: ${bcc.join(', ')}`)
      console.log(`Link: ${data.invoiceLink}`)
      console.log('--------------------------------------')
      return true
    }

    await transporter.sendMail(mailOptions)
    console.log(`Invoice email sent to ${customerEmail} (BCC: ${bcc.length})`)
    return true
  } catch (error) {
    console.error('Error sending invoice email:', error)
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
    return true
  } catch (error) {
    console.error('Error sending reset email:', error)
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
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
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
    return true
  } catch (error) {
    console.error('Error sending generic email:', error)
    return false
  }
}
