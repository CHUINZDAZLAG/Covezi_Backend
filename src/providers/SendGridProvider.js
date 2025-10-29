import sgMail from '@sendgrid/mail'
import { env } from '~/config/environment'

const SENDGRID_API_KEY = env.SENDGRID_API_KEY
const SENDER_EMAIL = env.SENDER_EMAIL
const SENDER_NAME = env.SENDER_NAME
const REPLY_EMAIL = env.REPLY_EMAIL

console.log('[SendGridProvider] Configuration:')
console.log('  - API Key exists:', !!SENDGRID_API_KEY)
console.log('  - API Key length:', SENDGRID_API_KEY?.length || 0)
console.log('  - Sender Email:', SENDER_EMAIL)
console.log('  - Sender Name:', SENDER_NAME)
console.log('  - Reply Email:', REPLY_EMAIL)

// Set SendGrid API key
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

// Function to send email with customizable parameters
const sendEmail = async ({
  to,
  toName,
  subject,
  html
}) => {
  try {
    console.log('[SendGrid.sendEmail] Starting email send...')
    console.log('  - To:', to)
    console.log('  - ToName:', toName)
    console.log('  - Subject:', subject)
    console.log('  - From:', SENDER_EMAIL)

    // Configure email parameters according to SendGrid specifications
    const msg = {
      to: {
        email: to,
        name: toName
      },
      from: {
        email: SENDER_EMAIL,
        name: SENDER_NAME
      },
      replyTo: REPLY_EMAIL,
      subject: subject,
      html: html
    }

    // Send email via SendGrid
    console.log('[SendGrid.sendEmail] Sending via SendGrid...')
    const data = await sgMail.send(msg)
    console.log('[SendGrid.sendEmail] ✅ Email sent successfully!')
    console.log('  - Response Status:', data[0]?.statusCode)
    return data
  } catch (error) {
    console.error('[SendGrid.sendEmail] ❌ Error:', error)
    console.error('  - Error Message:', error.message)
    console.error('  - Error Status:', error.statusCode)
    console.error('  - Error Response:', error.response?.body || error.response?.errors)
    throw error
  }
}

export const SendGridProvider = {
  sendEmail
}
