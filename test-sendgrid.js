import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'

dotenv.config()

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const ADMIN_SENDER_EMAIL = process.env.ADMIN_SENDER_EMAIL

console.log('=== SendGrid Configuration Test ===')
console.log('API Key:', SENDGRID_API_KEY ? '✅ Found' : '❌ Missing')
console.log('API Key length:', SENDGRID_API_KEY?.length || 0)
console.log('Sender Email:', ADMIN_SENDER_EMAIL)

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is missing in .env')
  process.exit(1)
}

sgMail.setApiKey(SENDGRID_API_KEY)

const testEmail = async () => {
  try {
    const msg = {
      to: 'nguyenthithanhchau2004@gmail.com',
      from: ADMIN_SENDER_EMAIL,
      subject: 'SendGrid Test Email',
      html: '<h1>Test Email</h1><p>If you see this, SendGrid is working!</p>'
    }

    console.log('\n📧 Sending test email...')
    const result = await sgMail.send(msg)
    console.log('✅ Email sent successfully!')
    console.log('Response:', result[0])
  } catch (error) {
    console.error('❌ Error sending email:')
    console.error('  Message:', error.message)
    console.error('  Status:', error.statusCode)
    console.error('  Response:', error.response?.body || 'No response body')
  }
}

testEmail()
