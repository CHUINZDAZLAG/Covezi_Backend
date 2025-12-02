import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'

dotenv.config()

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDER_EMAIL = process.env.SENDER_EMAIL

console.log('=== SendGrid Configuration Test ===')
console.log('API Key exists:', !!SENDGRID_API_KEY)
console.log('API Key length:', SENDGRID_API_KEY?.length || 0)
console.log('Sender Email:', SENDER_EMAIL)

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is missing in .env')
  process.exit(1)
}

if (!SENDER_EMAIL) {
  console.error('❌ SENDER_EMAIL is missing in .env')
  process.exit(1)
}

sgMail.setApiKey(SENDGRID_API_KEY)

const testEmail = async () => {
  try {
    const msg = {
      to: 'nguyenthithanhchau2004@gmail.com',
      from: SENDER_EMAIL,
      subject: 'SendGrid Test Email from Covezi',
      html: '<h1>Test Email</h1><p>If you see this, SendGrid is working correctly!</p>'
    }

    console.log('\n📧 Sending test email...')
    const result = await sgMail.send(msg)
    console.log('✅ Email sent successfully!')
    console.log('Status Code:', result[0].statusCode)
    console.log('Message ID:', result[0].headers['x-message-id'])
  } catch (error) {
    console.error('❌ Error sending email:')
    console.error('  Message:', error.message)
    console.error('  Status Code:', error.statusCode)
    if (error.response?.body) {
      console.error('  Response Body:', JSON.stringify(error.response.body, null, 2))
    }
  }
}

testEmail()
