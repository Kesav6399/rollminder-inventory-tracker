const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmailAlert = async (client, order, product) => {
  const reminderDate = new Date(order.expiry_date);
  reminderDate.setDate(reminderDate.getDate() + 3);
  const nextDeliveryDate = order.expiry_date;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: client.email,
    subject: `Reminder: Upcoming Paper Roll Delivery for ${client.name}`,
    text: `
Dear ${client.name},

This is a reminder that your next paper roll delivery is due on ${nextDeliveryDate}.

Order Details:
- Product: ${product.name}
- Quantity: ${order.quantity} rolls
- Price: $${order.price_at_sale}

Please contact us if you need to reschedule or have any questions.

Best regards,
Paper Roll Inventory Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .order-details { background-color: white; padding: 15px; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Delivery Reminder</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${client.name}</strong>,</p>
      <p>This is a reminder that your next paper roll delivery is due on <strong>${nextDeliveryDate}</strong>.</p>
      <div class="order-details">
        <h3>Order Details</h3>
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>Quantity:</strong> ${order.quantity} rolls</p>
        <p><strong>Price:</strong> $${order.price_at_sale}</p>
      </div>
      <p>Please contact us if you need to reschedule or have any questions.</p>
      <p>Best regards,<br>Paper Roll Inventory Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${client.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

const sendSmsAlert = async (client, order, product) => {
  console.log(`[SMS PLACEHOLDER] Sending SMS to ${client.phone}`);
  console.log(`[SMS PLACEHOLDER] Message: Dear ${client.name}, your delivery for ${product.name} (${order.quantity} rolls) is due on ${order.expiry_date}`);
  
  return {
    success: true,
    message: 'SMS placeholder - integrate Twilio API for actual SMS delivery',
    mock: true
  };
};

module.exports = {
  sendEmailAlert,
  sendSmsAlert,
};
