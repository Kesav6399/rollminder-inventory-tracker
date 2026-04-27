const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET all clients
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let query = 'SELECT * FROM clients';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const stmt = db.prepare(query);
    const rows = params.length > 0 ? stmt.all(...params) : stmt.all();

    const clientsWithMeta = rows.map((client) => {
      const lastOrder = db
        .prepare(`
          SELECT order_date, expiry_date
          FROM orders
          WHERE client_id = ?
          ORDER BY order_date DESC
          LIMIT 1
        `)
        .get(client.id);

      const nextExpiry = db
        .prepare(`
          SELECT expiry_date
          FROM orders
          WHERE client_id = ?
          ORDER BY expiry_date DESC
          LIMIT 1
        `)
        .get(client.id);

      return {
        ...client,
        last_order_date: lastOrder?.order_date || null,
        last_expiry_date: lastOrder?.expiry_date || null,
        next_expiry: nextExpiry?.expiry_date || null,
      };
    });

    res.json(clientsWithMeta);
  } catch (error) {
    console.error('Error fetching clients:', error.message);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET single client
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error.message);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// CREATE client
router.post('/', async (req, res) => {
  try {
    const {
      name,
      contact_person,
      phone,
      email,
      address,
      gst_number,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const id = uuidv4();

    const query = `
      INSERT INTO clients (
        id,
        name,
        contact_person,
        phone,
        email,
        address,
        gst_number,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(query);

    stmt.run(
      id,
      name.trim(),
      contact_person || null,
      phone || null,
      email || null,
      address || null,
      gst_number || null,
      notes || null
    );

    const createdClient = db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .get(id);

    res.status(201).json(createdClient);
  } catch (error) {
    console.error('Error creating client:', error.message);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// UPDATE client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      contact_person,
      phone,
      email,
      address,
      gst_number,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const existingClient = db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .get(id);

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const query = `
      UPDATE clients
      SET
        name = ?,
        contact_person = ?,
        phone = ?,
        email = ?,
        address = ?,
        gst_number = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const stmt = db.prepare(query);

    stmt.run(
      name.trim(),
      contact_person || null,
      phone || null,
      email || null,
      address || null,
      gst_number || null,
      notes || null,
      id
    );

    const updatedClient = db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .get(id);

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error.message);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error.message);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;