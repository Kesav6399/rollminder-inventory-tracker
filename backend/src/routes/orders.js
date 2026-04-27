const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const query = `
      SELECT 
        o.*,
        p.name as product_name,
        p.description as product_description,
        p.unit_price as product_unit_price
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.client_id = ?
      ORDER BY o.order_date DESC
    `;
    const stmt = db.prepare(query);
    res.json(stmt.all(clientId));
  } catch (error) {
    console.error('Error fetching client orders:', error.message);
    res.status(500).json({ error: 'Failed to fetch client orders' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { client_id } = req.query;
    let query = `
      SELECT 
        o.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        p.name as product_name,
        p.description as product_description,
        p.unit_price as product_unit_price
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN products p ON o.product_id = p.id
    `;

    if (client_id) {
      query += ' WHERE o.client_id = ? ORDER BY o.order_date DESC';
      const stmt = db.prepare(query);
      return res.json(stmt.all(client_id));
    }

    query += ' ORDER BY o.order_date DESC';
    const stmt = db.prepare(query);
    res.json(stmt.all());
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        o.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        p.name as product_name,
        p.description as product_description,
        p.unit_price as product_unit_price
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `;
    const stmt = db.prepare(query);
    const result = stmt.get(id);

    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching order:', error.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

const createRemindersForOrder = (orderId, clientId, expiryDate, reminderDays = [3], reminderType = 'all') => {
  const expiry = new Date(expiryDate);

  reminderDays.forEach(days => {
    const reminderDate = new Date(expiry);
    reminderDate.setDate(reminderDate.getDate() - days);
    const reminderDateStr = reminderDate.toISOString().split('T')[0];

    const existingReminder = db.prepare(`
      SELECT id FROM reminders
      WHERE order_id = ? AND reminder_date = ? AND status = 'pending'
    `).get(orderId, reminderDateStr);

    if (!existingReminder) {
      const reminderId = uuidv4();
      const message = `Prepare next order for client. Delivery due in ${days} days. Order expires on ${expiryDate}.`;

      db.prepare(`
        INSERT INTO reminders (id, client_id, order_id, reminder_type, reminder_date, reminder_time, status, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(reminderId, clientId, orderId, reminderType, reminderDateStr, '09:00', 'pending', message);

      console.log(`[Order] Created reminder for ${reminderDateStr} (${days} days before expiry)`);
    }
  });
};

router.post('/', async (req, res) => {
  try {
    const {
      client_id,
      product_id,
      quantity,
      price_per_unit,
      total_amount,
      order_date,
      expiry_date,
      bill_number,
      payment_status,
      notes,
      reminder_days,
      reminder_type = 'all',
    } = req.body;

    if (!client_id || !product_id || !quantity || !price_per_unit || !expiry_date) {
      return res.status(400).json({
        error: 'client_id, product_id, quantity, price_per_unit, and expiry_date are required',
      });
    }

    const id = uuidv4();
    const calculatedTotal = total_amount || Number(quantity) * Number(price_per_unit);
    const finalOrderDate = order_date || new Date().toISOString().split('T')[0];

    const query = `
      INSERT INTO orders (
        id, client_id, product_id, quantity, price_per_unit, total_amount,
        order_date, expiry_date, bill_number, payment_status, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(query);
    stmt.run(
      id,
      client_id,
      product_id,
      Number(quantity),
      Number(price_per_unit),
      Number(calculatedTotal),
      finalOrderDate,
      expiry_date,
      bill_number || null,
      payment_status || 'unpaid',
      notes || null
    );

    const days = reminder_days && reminder_days.length > 0 ? reminder_days : [3];
    createRemindersForOrder(id, client_id, expiry_date, days, reminder_type);

    const result = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating order:', error.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_id,
      product_id,
      quantity,
      price_per_unit,
      total_amount,
      order_date,
      expiry_date,
      bill_number,
      payment_status,
      notes,
    } = req.body;

    if (!client_id || !product_id || !quantity || !price_per_unit || !expiry_date) {
      return res.status(400).json({
        error: 'client_id, product_id, quantity, price_per_unit, and expiry_date are required',
      });
    }

    const calculatedTotal = total_amount || Number(quantity) * Number(price_per_unit);
    const query = `
      UPDATE orders 
      SET 
        client_id = ?,
        product_id = ?,
        quantity = ?,
        price_per_unit = ?,
        total_amount = ?,
        order_date = ?,
        expiry_date = ?,
        bill_number = ?,
        payment_status = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const stmt = db.prepare(query);
    stmt.run(
      client_id,
      product_id,
      Number(quantity),
      Number(price_per_unit),
      Number(calculatedTotal),
      order_date || new Date().toISOString().split('T')[0],
      expiry_date,
      bill_number || null,
      payment_status || 'unpaid',
      notes || null,
      id
    );

    const result = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating order:', error.message);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error.message);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;