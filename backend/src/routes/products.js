const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR description LIKE ? OR product_type LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const stmt = db.prepare(query);
    const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const result = stmt.get(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, product_type, description, unit_price, default_quantity, notes } = req.body;
    
    if (!name || !unit_price) {
      return res.status(400).json({ error: 'Product name and unit price are required' });
    }

    const id = uuidv4();
    const query = `
      INSERT INTO products (id, name, product_type, description, unit_price, default_quantity, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const stmt = db.prepare(query);
    stmt.run(id, name, product_type || null, description || null, unit_price, default_quantity || 1, notes || null);
    
    const result = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, product_type, description, unit_price, default_quantity, notes } = req.body;
    
    const query = `
      UPDATE products 
      SET name = ?, product_type = ?, description = ?, unit_price = ?, default_quantity = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const stmt = db.prepare(query);
    stmt.run(name, product_type || null, description || null, unit_price, default_quantity || 1, notes || null, id);
    
    const result = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;