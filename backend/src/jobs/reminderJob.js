const cron = require('node-cron');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { sendEmailReminder } = require('../services/emailService');
const { sendSmsReminder } = require('../services/smsService');

const processReminder = async (reminder) => {
  const {
    id,
    client_id,
    order_id,
    reminder_type,
    reminder_date,
    reminder_time,
    message
  } = reminder;

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);
  const order = order_id ? db.prepare(`
    SELECT o.*, p.name as product_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.id = ?
  `).get(order_id) : null;

  const reminderData = {
    ...reminder,
    client_name: client?.name,
    client_email: client?.email,
    phone: client?.phone,
    product_name: order?.product_name,
    order_quantity: order?.quantity,
    expiry_date: order?.expiry_date,
  };

  let emailStatus = { success: false, status: 'skipped', message: 'Not requested' };
  let smsStatus = { success: false, status: 'skipped', message: 'Not requested' };

  try {
    if (reminder_type === 'email' || reminder_type === 'all') {
      emailStatus = await sendEmailReminder(reminderData);
    }

    if (reminder_type === 'sms' || reminder_type === 'all') {
      smsStatus = await sendSmsReminder(reminderData);
    }
  } catch (notifyError) {
    console.error('[Process] Error sending notifications:', notifyError.message);
  }

  const logId = uuidv4();
  const logStatus = emailStatus.status === 'failed' || smsStatus.status === 'failed' ? 'failed' :
                    emailStatus.status === 'sent' || smsStatus.status === 'sent' ? 'sent' : 'skipped';
  const errorMessage = emailStatus.message || smsStatus.message || null;

  try {
    db.prepare(`
      INSERT INTO reminder_logs (id, reminder_id, client_id, order_id, sent_via, status, error_message, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, id, client_id, order_id, reminder_type, logStatus, errorMessage, new Date().toISOString());
  } catch (logError) {
    console.error('[Process] Error logging reminder:', logError.message);
  }

  return { emailStatus, smsStatus };
};

const checkAndSendReminders = async () => {
  console.log(`[CRON] Running reminder check at ${new Date().toISOString()}`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  try {
    const pendingReminders = db.prepare(`
      SELECT r.*, c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM reminders r
      JOIN clients c ON r.client_id = c.id
      WHERE r.reminder_date = ? AND r.status = 'pending'
      ORDER BY r.reminder_time ASC
    `).all(todayStr);

    console.log(`[CRON] Found ${pendingReminders.length} pending reminders for today`);

    for (const reminder of pendingReminders) {
      const alreadySent = db.prepare(`
        SELECT id FROM reminder_logs
        WHERE reminder_id = ? AND DATE(sent_at) = ?
      `).get(reminder.id, todayStr);

      if (alreadySent) {
        console.log(`[CRON] Skipping reminder ${reminder.id} - already sent today`);
        continue;
      }

      try {
        const result = await processReminder(reminder);

        db.prepare(`
          UPDATE reminders SET status = 'sent' WHERE id = ?
        `).run(reminder.id);

        console.log(`[CRON] Processed reminder ${reminder.id} - Email: ${result.emailStatus.status}, SMS: ${result.smsStatus.status}`);
      } catch (error) {
        console.error(`[CRON] Error processing reminder ${reminder.id}:`, error.message);
      }
    }

    console.log(`[CRON] Reminder check completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('[CRON] Error in reminder check:', error.message);
  }
};

const testSendReminder = async (reminderId) => {
  console.log(`[Test] Fetching reminder ${reminderId}`);

  const reminder = db.prepare(`
    SELECT r.*, c.name as client_name, c.email as client_email, c.phone as client_phone,
           o.quantity as order_quantity, o.expiry_date, p.name as product_name, r.reminder_time
    FROM reminders r
    JOIN clients c ON r.client_id = c.id
    LEFT JOIN orders o ON r.order_id = o.id
    LEFT JOIN products p ON o.product_id = p.id
    WHERE r.id = ?
  `).get(reminderId);

  if (!reminder) {
    console.error(`[Test] Reminder not found: ${reminderId}`);
    throw new Error('Reminder not found');
  }

  console.log(`[Test] Found reminder for client: ${reminder.client_name}`);
  console.log(`[Test] Reminder type: ${reminder.reminder_type}`);
  console.log(`[Test] Client email: ${reminder.client_email}`);
  console.log(`[Test] Client phone: ${reminder.phone}`);

  return await processReminder(reminder);
};

const startCronJob = () => {
  console.log('[CRON] Scheduling daily reminder check at 9:00 AM');

  cron.schedule('0 9 * * *', () => {
    console.log('[CRON] Daily reminder job triggered');
    checkAndSendReminders();
  });

  console.log('[CRON] Cron job scheduled successfully');
};

module.exports = {
  startCronJob,
  checkAndSendReminders,
  testSendReminder,
};
