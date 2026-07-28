const nodemailer = require('nodemailer');

/**
 * Sends an email notification.
 * If credentials are not supplied in the environment, it falls back to printing the contents to the console.
 * This guarantees the application continues to run without errors during offline development.
 * 
 * @param {string} to - The recipient's email address
 * @param {string} subject - The subject line of the email
 * @param {string} text - The plain text content of the email
 * @param {string} html - The HTML formatted content of the email
 */
const sendEmail = async ({ to, subject, text, html, attachments }) => {
  // Check if SMTP configurations are present in the environment variables
  const isMailConfigured =
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_HOST;

  if (!isMailConfigured) {
    console.log('\n=== EMAIL NOTIFICATION (CONSOLE FALLBACK) ===');
    console.log(`To:          ${to}`);
    console.log(`Subject:     ${subject}`);
    console.log(`Message:     ${text}`);
    if (attachments && attachments.length > 0) {
      console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`);
    }
    console.log('============================================\n');
    return { success: true, fallback: true };
  }

  try {
    // Create nodemailer transporter using environment values
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Leave Management System" <no-reply@lms.edu>`,
      to,
      subject,
      text,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error('Error occurred while sending email:', error.message);
    // Do not throw an error to prevent the API call from failing
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
