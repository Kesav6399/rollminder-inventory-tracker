const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;
let emailConfigured = false;

const isValidEmail = (email) => email && email.includes('@') && !email.includes('your_') && email !== 'your_email@gmail.com';

if (process.env.EMAIL_HOST && isValidEmail(process.env.EMAIL_USER) && process.env.EMAIL_PASS && !process.env.EMAIL_PASS.includes('your_')) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    emailConfigured = true;
    console.log('[Email] Email service configured');
  } catch (error) {
    console.warn('[Email] Failed to create transporter:', error.message);
  }
} else {
  console.log('[Email] Email service not configured. Set valid EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env');
}

const sendEmailReminder = async (reminder) => {
  if (!transporter) {
    console.warn('[Email] Email service not configured. Skipping email reminder.');
    return { success: false, status: 'skipped', message: 'Email credentials not configured' };
  }

  const {
    client_name,
    client_email,
    phone,
    product_name,
    order_quantity,
    expiry_date,
    reminder_date,
    reminder_time,
    message,
  } = reminder;

  const recipient = process.env.OWNER_EMAIL || client_email;
  if (!recipient) {
    console.warn('[Email] No recipient email available');
    return { success: false, status: 'skipped', message: 'No recipient email configured' };
  }

  const subject = `RollMinder Reminder: Prepare next order for ${client_name}`;

  const textBody = `
RollMinder Reminder

Client: ${client_name}
Product: ${product_name || 'N/A'}
Quantity: ${order_quantity || 'N/A'}
Due Date: ${expiry_date || 'N/A'}
Reminder Date: ${reminder_date} ${reminder_time || ''}
Message: ${message || 'N/A'}
Phone: ${phone || 'N/A'}
${client_email ? `Email: ${client_email}` : ''}

Please prepare for the next delivery.
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; border-radius: 5px; margin-top: 15px; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RollMinder Reminder</h1>
    </div>
    <div class="content">
      <p><strong>Prepare next order for ${client_name}</strong></p>
      <div class="details">
        <div class="detail-row"><span class="detail-label">Client:</span> ${client_name}</div>
        <div class="detail-row"><span class="detail-label">Product:</span> ${product_name || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Quantity:</span> ${order_quantity || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Due Date:</span> ${expiry_date || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Reminder Date:</span> ${reminder_date} ${reminder_time || ''}</div>
        <div class="detail-row"><span class="detail-label">Message:</span> ${message || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Phone:</span> ${phone || 'N/A'}</div>
        ${client_email ? '<div class="detail-row"><span class="detail-label">Email:</span> ' + client_email + '</div>' : ''}
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message from RollMinder.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody,
    });
    console.log(`[Email] Sent to ${recipient}: ${info.messageId}`);
    return { success: true, status: 'sent', messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error sending email:', error.message);
    return { success: false, status: 'failed', message: error.message };
  }
};

module.exports = { sendEmailReminder, emailConfigured };
