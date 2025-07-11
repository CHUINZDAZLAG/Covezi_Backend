import { MailerSend, EmailParams, Sender, Recipient, Attachment } from 'mailersend'
// import fs from 'fs'
import { env } from '~/config/environment'

const MAILERSEND_API_KEY = env.MAILERSEND_API_KEY
const ADMIN_SENDER_EMAIL = env.ADMIN_SENDER_EMAIL
const ADMIN_SENDER_NAME = env.ADMIN_SENDER_NAME

// Create Instance of MailerSend to use
const mailerSendInstance = new MailerSend({ apiKey: MAILERSEND_API_KEY })

// Create sentFrom: sender
const sentFrom = new Sender(ADMIN_SENDER_EMAIL, ADMIN_SENDER_NAME)

// Function to send email
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
    // Setup email va ten nguoi nhan, hoac nhieu ng nhan, du lieu trong mang
    const recipients = [
      new Recipient(to, toName)
      // new Recipient(to, toName) co the gui nhieu email 1 luc
    ]

    // // CC (Carbon Copy): Gửi bản sao công khai, nghĩa là gửi bản sao của email cho người khác để họ biết nội
    // // dung email, nhưng không cần phản hồi.
    // // Người nhận chính và người được CC đều thấy email của nhau.
    // const cc = [
    //   new Recipient('your_cc_01@trungquandev.com', 'Your Client CC 01'),
    //   new Recipient('your_cc_02@trungquandev.com', 'Your Client CC 02'),
    //   new Recipient('your_cc_03@trungquandev.com', 'Your Client CC 03')
    // ]

    // // BCC (Blind Carbon Copy): Gửi bản sao ẩn danh, nghĩa là người nhận chính không biết ai đang nhận BCC.
    // // BCC rất hữu ích khi gửi email hàng loạt (VD: thông báo đến nhiều khách hàng mà không cho phép họ thấy
    // // thông tin nhau).
    // const bcc = [
    //   new Recipient('your_bcc_01@trungquandev.com', 'Your Client BCC 01'),
    //   new Recipient('your_bcc_02@trungquandev.com', 'Your Client BCC 02'),
    //   new Recipient('your_bcc_03@trungquandev.com', 'Your Client BCC 03')
    // ]

    // // attachments: attachment files
    // const buildAttachments = attachments.map(att => {
    //   return new Attachment(
    //     fs.readFileSync(att.filePath, { encoding: 'base64' }),
    //     att.fileName,
    //     att.attachmentType,
    //     att.fileId // For inline attachment
    //   )
    // })

    // Setup email params theo chuan cua MailerSend
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      // .setTemplateId(templateId) // Template duoc tao tu MailerSend dashboard
      // .setPersonalization(personalizationData) // Dynamic data, cac bien truyen vao template
      // .setAttachments(buildAttachments)
      // .setCc(cc)
      // .setBcc(bcc)
      .setHtml(html) // Dung html de dinh kem file vao content
      // .setText(text) Email dang text don gian, it dung
      // .setSendAt(sendAt)

    // Send email
    const data = await mailerSendInstance.email.send(emailParams)
    return data
  } catch (error) {
    throw error
  }
}

export const MailerSendProvider = {
  sendEmail
}