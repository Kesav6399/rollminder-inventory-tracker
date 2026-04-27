const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const { client_id, status, search } = req.query;
    let query = `
      SELECT b.*, c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM bills b
      JOIN clients c ON b.client_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (client_id) {
      query += ' AND b.client_id = ?';
      params.push(client_id);
    }

    if (status) {
      query += ' AND b.payment_status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (b.bill_number LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY b.bill_date DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching bills:', error.message);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { client_id, status } = req.query;
    let query = `
      SELECT 
        o.id,
        o.bill_number,
        o.order_date as bill_date,
        o.expiry_date as due_date,
        o.total_amount,
        o.payment_status,
        o.notes,
        o.client_id,
        c.name as client_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (client_id) {
      query += ' AND o.client_id = ?';
      params.push(client_id);
    }

    if (status) {
      query += ' AND o.payment_status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.order_date DESC';

    const stmt = db.prepare(query);
    res.json(stmt.all(...params));
  } catch (error) {
    console.error('Error fetching order bills:', error.message);
    res.status(500).json({ error: 'Failed to fetch order bills' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT b.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address
      FROM bills b
      JOIN clients c ON b.client_id = c.id
      WHERE b.id = ?
    `);
    const result = stmt.get(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching bill:', error.message);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, bill_number, bill_date, due_date, total_amount, paid_amount, payment_status, notes } = req.body;
    
    if (!client_id || !total_amount) {
      return res.status(400).json({ error: 'Client and total amount are required' });
    }

    const id = uuidv4();
    const query = `
      INSERT INTO bills (id, client_id, bill_number, bill_date, due_date, total_amount, paid_amount, payment_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const stmt = db.prepare(query);
    stmt.run(
      id, 
      client_id, 
      bill_number || null, 
      bill_date || new Date().toISOString().split('T')[0], 
      due_date || null, 
      Number(total_amount), 
      Number(paid_amount) || 0, 
      payment_status || 'unpaid', 
      notes || null
    );
    
    const result = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating bill:', error.message);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { bill_number, bill_date, due_date, total_amount, paid_amount, payment_status, payment_date, notes } = req.body;
    
    const existingBill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    if (!existingBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    const query = `
      UPDATE bills 
      SET bill_number = ?, bill_date = ?, due_date = ?, total_amount = ?, 
          paid_amount = ?, payment_status = ?, payment_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const stmt = db.prepare(query);
    stmt.run(
      bill_number || existingBill.bill_number,
      bill_date || existingBill.bill_date,
      due_date || existingBill.due_date,
      Number(total_amount) || existingBill.total_amount,
      Number(paid_amount) || existingBill.paid_amount,
      payment_status || existingBill.payment_status,
      payment_date || existingBill.payment_date,
      notes || existingBill.notes,
      id
    );
    
    const result = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    res.json(result);
  } catch (error) {
    console.error('Error updating bill:', error.message);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM bills WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error.message);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

module.exports = router;