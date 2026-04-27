require('dotenv').config();

let client = null;
let smsConfigured = false;

const isValidTwilio = () => 
  process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') && 
  process.env.TWILIO_AUTH_TOKEN && 
  !process.env.TWILIO_AUTH_TOKEN.includes('your_') &&
  process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid';

if (isValidTwilio()) {
  try {
    client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    smsConfigured = true;
  } catch (e) {
    console.warn('[SMS] Failed to initialize Twilio:', e.message);
  }
}

const sendSmsReminder = async (reminder) => {
  const {
    client_name,
    phone,
    product_name,
    order_quantity,
    expiry_date,
  } = reminder;

  if (!phone) {
    console.warn('[SMS] No client phone available');
    return { success: false, status: 'skipped', message: 'No client phone available' };
  }

  if (!client || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('[SMS] Twilio not configured. SMS notification skipped.');
    console.log(`[SMS] Would send to ${phone}: RollMinder: Prepare next order for ${client_name}. Product: ${product_name}. Qty: ${order_quantity}. Due: ${expiry_date}.`);
    return { success: false, status: 'skipped', message: 'Twilio credentials not configured' };
  }

  const toNumber = phone.startsWith('+') ? phone : `+${phone}`;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  const messageBody = `RollMinder: Prepare next order for ${client_name}. Product: ${product_name}. Qty: ${order_quantity}. Due: ${expiry_date}.`;

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: fromNumber,
      to: toNumber,
    });

    console.log(`[SMS] Sent to ${phone}: SID=${message.sid}`);
    return { success: true, status: 'sent', messageSid: message.sid };
  } catch (error) {
    console.error('[SMS] Error sending SMS:', error.message);
    return { success: false, status: 'failed', message: error.message };
  }
};

module.exports = { sendSmsReminder, smsConfigured };
