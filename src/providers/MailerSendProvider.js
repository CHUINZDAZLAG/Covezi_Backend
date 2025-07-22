/* eslint-disable no-unused-vars */
import { MailerSend, EmailParams, Sender, Recipient, Attachment } from 'mailersend'
// import fs from 'fs'
import { env } from '~/config/environment'

const MAILERSEND_API_KEY = env.MAILERSEND_API_KEY
const ADMIN_SENDER_EMAIL = env.ADMIN_SENDER_EMAIL
const ADMIN_SENDER_NAME = env.ADMIN_SENDER_NAME

// Create MailerSend instance with API key for email service
const mailerSendInstance = new MailerSend({ apiKey: MAILERSEND_API_KEY })

// Configure default sender information for all outgoing emails
const sentFrom = new Sender(ADMIN_SENDER_EMAIL, ADMIN_SENDER_NAME)

// Function to send email with customizable parameters
const sendEmail = async ({
  to,
  toName,
  subject,
  html
  // personalizationData
  // attachments
  // templateId,
  // sendAt
}) => {
  try {
    // Configure recipient list (supports multiple recipients)
    const recipients = [
      new Recipient(to, toName)
      // Additional recipients can be added to this array
    ]

    // // CC (Carbon Copy): Send public copy to additional recipients
    // // Both primary recipient and CC recipients can see each other's email addresses
    // const cc = [
    //   new Recipient('your_cc_01@trungquandev.com', 'Your Client CC 01'),
    //   new Recipient('your_cc_02@trungquandev.com', 'Your Client CC 02'),
    //   new Recipient('your_cc_03@trungquandev.com', 'Your Client CC 03')
    // ]

    // // BCC (Blind Carbon Copy): Send hidden copy to recipients
    // // Primary recipient cannot see BCC recipients, useful for mass notifications
    // // while maintaining privacy between recipients
    // const bcc = [
    //   new Recipient('your_bcc_01@trungquandev.com', 'Your Client BCC 01'),
    //   new Recipient('your_bcc_02@trungquandev.com', 'Your Client BCC 02'),
    //   new Recipient('your_bcc_03@trungquandev.com', 'Your Client BCC 03')
    // ]

    // // File attachments: Convert files to base64 for email delivery
    // const buildAttachments = attachments.map(att => {
    //   return new Attachment(
    //     fs.readFileSync(att.filePath, { encoding: 'base64' }),
    //     att.fileName,
    //     att.attachmentType,
    //     att.fileId // For inline attachment
    //   )
    // })

    // Configure email parameters according to MailerSend specifications
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      // .setTemplateId(templateId) // Use pre-built template from MailerSend dashboard
      // .setPersonalization(personalizationData) // Dynamic variables for template substitution
      // .setAttachments(buildAttachments)
      // .setCc(cc)
      // .setBcc(bcc)
      .setHtml(html) // HTML content for rich email formatting
      // .setText(text) // Plain text alternative (rarely used)
      // .setSendAt(sendAt)

    // Send email and return response data
    const data = await mailerSendInstance.email.send(emailParams)
    return data
  } catch (error) {
    throw error
  }
}

export const MailerSendProvider = {
  sendEmail
}