const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { testSendReminder } = require('../jobs/reminderJob');

router.get('/', async (req, res) => {
  try {
    const { client_id, status, date_from, date_to } = req.query;

    let query = `
      SELECT 
        r.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        p.name as product_name,
        o.quantity as order_quantity,
        o.expiry_date
      FROM reminders r
      JOIN clients c ON r.client_id = c.id
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE 1=1
    `;

    const params = [];

    if (client_id) {
      query += ' AND r.client_id = ?';
      params.push(client_id);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (date_from) {
      query += ' AND r.reminder_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND r.reminder_date <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY r.reminder_date ASC, r.reminder_time ASC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    const reminders = rows.map(row => {
      const reminderDate = new Date(row.reminder_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      reminderDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...row,
        days_left: daysLeft
      };
    });

    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error.message);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

router.get('/upcoming', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 14);
    const futureStr = futureDate.toISOString().split('T')[0];

    const query = `
      SELECT 
        r.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        p.name as product_name,
        o.quantity as order_quantity,
        o.expiry_date
      FROM reminders r
      JOIN clients c ON r.client_id = c.id
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE r.reminder_date BETWEEN ? AND ?
        AND r.status = 'pending'
      ORDER BY r.reminder_date ASC, r.reminder_time ASC
    `;

    const stmt = db.prepare(query);
    const result = stmt.all(todayStr, futureStr);

    const reminders = result.map((row) => {
      const reminderDate = new Date(row.reminder_date);
      reminderDate.setHours(0, 0, 0, 0);

      const daysLeft = Math.ceil(
        (reminderDate - today) / (1000 * 60 * 60 * 24)
      );

      let badge_status = 'green';

      if (daysLeft <= 0) {
        badge_status = 'red';
      } else if (daysLeft <= 3) {
        badge_status = 'yellow';
      }

      return {
        ...row,
        days_left: daysLeft,
        badge_status,
      };
    });

    res.json(reminders);
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error.message);
    res.status(500).json({ error: 'Failed to fetch upcoming reminders' });
  }
});

router.post('/test-send/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Test Send] Testing reminder ${id}`);
    
    const result = await testSendReminder(id);
    
    console.log(`[Test Send] Result:`, result);
    
    res.json({ 
      success: true, 
      message: 'Test reminder processed',
      emailResult: result.emailStatus,
      smsResult: result.smsStatus
    });
  } catch (error) {
    console.error('Error sending test reminder:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        r.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        p.name as product_name,
        o.quantity as order_quantity,
        o.expiry_date
      FROM reminders r
      JOIN clients c ON r.client_id = c.id
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE r.id = ?
    `;

    const stmt = db.prepare(query);
    const result = stmt.get(id);

    if (!result) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching reminder:', error.message);
    res.status(500).json({ error: 'Failed to fetch reminder' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      client_product_id,
      client_id,
      order_id,
      reminder_type,
      reminder_date,
      reminder_time,
      message,
    } = req.body;

    if (!client_id || !reminder_date) {
      return res.status(400).json({
        error: 'Client and reminder date are required',
      });
    }

    const id = uuidv4();
    const query = `
      INSERT INTO reminders (
        id, client_product_id, client_id, order_id, reminder_type,
        reminder_date, reminder_time, message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(query);
    stmt.run(
      id,
      client_product_id || null,
      client_id,
      order_id || null,
      reminder_type || 'email',
      reminder_date,
      reminder_time || '09:00',
      message || null
    );

    const createdReminder = db
      .prepare('SELECT * FROM reminders WHERE id = ?')
      .get(id);

    res.status(201).json(createdReminder);
  } catch (error) {
    console.error('Error creating reminder:', error.message);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      reminder_type,
      reminder_date,
      reminder_time,
      message,
      status,
    } = req.body;

    const existingReminder = db
      .prepare('SELECT * FROM reminders WHERE id = ?')
      .get(id);

    if (!existingReminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const query = `
      UPDATE reminders
      SET
        reminder_type = ?,
        reminder_date = ?,
        reminder_time = ?,
        message = ?,
        status = ?
      WHERE id = ?
    `;

    const stmt = db.prepare(query);
    stmt.run(
      reminder_type || existingReminder.reminder_type || 'email',
      reminder_date || existingReminder.reminder_date,
      reminder_time || existingReminder.reminder_time || '09:00',
      message || existingReminder.message || null,
      status || existingReminder.status || 'pending',
      id
    );

    const updatedReminder = db
      .prepare('SELECT * FROM reminders WHERE id = ?')
      .get(id);

    res.json(updatedReminder);
  } catch (error) {
    console.error('Error updating reminder:', error.message);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const existingReminder = db
      .prepare('SELECT * FROM reminders WHERE id = ?')
      .get(id);

    if (!existingReminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const query = `
      UPDATE reminders
      SET status = 'completed'
      WHERE id = ?
    `;

    const stmt = db.prepare(query);
    stmt.run(id);

    const completedReminder = db
      .prepare('SELECT * FROM reminders WHERE id = ?')
      .get(id);

    res.json(completedReminder);
  } catch (error) {
    console.error('Error completing reminder:', error.message);
    res.status(500).json({ error: 'Failed to complete reminder' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingReminder = db
      .prepare('SELECT * FROM reminders WHERE id = ?')
      .get(id);

    if (!existingReminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const stmt = db.prepare('DELETE FROM reminders WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error.message);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

module.exports = router;