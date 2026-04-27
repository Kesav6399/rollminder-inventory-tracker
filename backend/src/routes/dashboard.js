const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/upcoming-reminders', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 14);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    const query = `
      SELECT 
        o.id as order_id,
        o.quantity,
        o.price_per_unit as price_at_sale,
        o.order_date,
        o.expiry_date,
        o.notes,
        c.id as client_id,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN products p ON o.product_id = p.id
      WHERE o.expiry_date BETWEEN ? AND ?
      ORDER BY o.expiry_date ASC
    `;

    const stmt = db.prepare(query);
    const result = stmt.all(todayStr, futureStr);
    
    const reminders = result.map(row => {
      const expiryDate = new Date(row.expiry_date);
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      let stat = 'green';
      if (daysLeft <= 2) stat = 'red';
      else if (daysLeft <= 7) stat = 'yellow';
      
      return { ...row, days_left: daysLeft, status: stat };
    });

    res.json(reminders);
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error.message);
    res.status(500).json({ error: 'Failed to fetch upcoming reminders' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const clientCount = db.prepare('SELECT COUNT(*) as total FROM clients').get();
    const productCount = db.prepare('SELECT COUNT(*) as total FROM products').get();
    const orderCount = db.prepare('SELECT COUNT(*) as total FROM orders').get();
    
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const upcomingQuery = db.prepare('SELECT COUNT(*) as total FROM orders WHERE expiry_date BETWEEN ? AND ?');
    const upcomingExpiry = upcomingQuery.get(todayStr, sevenDaysLater.toISOString().split('T')[0]);

    const dueTodayQuery = db.prepare('SELECT COUNT(*) as total FROM orders WHERE expiry_date = ?');
    const dueToday = dueTodayQuery.get(todayStr);

    const overdueQuery = db.prepare('SELECT COUNT(*) as total FROM orders WHERE expiry_date < ? AND expiry_date >= ?');
    const overdue = overdueQuery.get(todayStr, '2020-01-01');

    const unpaidBillsQuery = db.prepare('SELECT COUNT(*) as total FROM bills WHERE payment_status = ?');
    const unpaidBills = unpaidBillsQuery.get('unpaid');

    const paidBillsQuery = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM bills WHERE payment_status = ?');
    const paidBills = paidBillsQuery.get('paid');

    const pendingRemindersQuery = db.prepare('SELECT COUNT(*) as total FROM reminders WHERE reminder_date >= ? AND status = ?');
    const pendingReminders = pendingRemindersQuery.get(todayStr, 'pending');

    res.json({
      total_clients: clientCount?.total || 0,
      total_products: productCount?.total || 0,
      total_orders: orderCount?.total || 0,
      upcoming_expiry_7_days: upcomingExpiry?.total || 0,
      due_today: dueToday?.total || 0,
      overdue: overdue?.total || 0,
      total_unpaid_bills: unpaidBills?.total || 0,
      total_paid_amount: paidBills?.total || 0,
      pending_reminders: pendingReminders?.total || 0
    });
  } catch (error) {
    console.error('Error fetching summary:', error.message);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;