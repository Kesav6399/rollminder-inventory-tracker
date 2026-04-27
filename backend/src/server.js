const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'RollMinder API', version: '1.0.0' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RollMinder backend running' });
});

// Load routes safely
let authRoutes, clientRoutes, productRoutes, orderRoutes, dashboardRoutes, billRoutes, reminderRoutes;

try { authRoutes = require('./routes/auth'); } catch (e) { console.warn('[Route] auth:', e.message); authRoutes = express.Router(); }
try { clientRoutes = require('./routes/clients'); } catch (e) { console.warn('[Route] clients:', e.message); clientRoutes = express.Router(); }
try { productRoutes = require('./routes/products'); } catch (e) { console.warn('[Route] products:', e.message); productRoutes = express.Router(); }
try { orderRoutes = require('./routes/orders'); } catch (e) { console.warn('[Route] orders:', e.message); orderRoutes = express.Router(); }
try { dashboardRoutes = require('./routes/dashboard'); } catch (e) { console.warn('[Route] dashboard:', e.message); dashboardRoutes = express.Router(); }
try { billRoutes = require('./routes/bills'); } catch (e) { console.warn('[Route] bills:', e.message); billRoutes = express.Router(); }
try { reminderRoutes = require('./routes/reminders'); } catch (e) { console.warn('[Route] reminders:', e.message); reminderRoutes = express.Router(); }

// Public routes - NO auth middleware
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reminders', reminderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const initAdminUser = () => {
  try {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      const id = 'admin-' + uuidv4();
      const passwordHash = bcrypt.hashSync('admin123', 10);
      db.prepare(`INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`)
        .run(id, 'Admin', 'admin@rollminder.com', passwordHash, 'admin');
      console.log('[Init] Admin: admin@rollminder.com / admin123');
    }
  } catch (e) { console.error('[Init] Error:', e.message); }
};

const startCronSafely = () => {
  try { require('./jobs/reminderJob').startCronJob(); console.log('[CRON] Started'); } 
  catch (e) { console.warn('[CRON] Failed:', e.message); }
};

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server: http://localhost:${PORT}`);
  initAdminUser();
  startCronSafely();
});

module.exports = app;