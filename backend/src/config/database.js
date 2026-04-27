const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database/rollminder.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

console.log('Connected to SQLite database');

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        gst_number TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        product_type TEXT,
        description TEXT,
        unit_price REAL NOT NULL,
        default_quantity INTEGER DEFAULT 1,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_products (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity_supplied INTEGER DEFAULT 1,
        price_per_unit REAL,
        delivery_frequency_days INTEGER,
        next_delivery_date TEXT,
        reminder_days_before INTEGER DEFAULT 3,
        reminder_time TEXT DEFAULT '09:00',
        reminder_type TEXT DEFAULT 'email',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(client_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        client_product_id TEXT,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price_per_unit REAL NOT NULL,
        total_amount REAL NOT NULL,
        order_date TEXT NOT NULL DEFAULT CURRENT_DATE,
        expiry_date TEXT NOT NULL,
        bill_number TEXT,
        payment_status TEXT DEFAULT 'unpaid',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (client_product_id) REFERENCES client_products(id) ON DELETE SET NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        bill_number TEXT UNIQUE,
        bill_date TEXT NOT NULL DEFAULT CURRENT_DATE,
        due_date TEXT,
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'unpaid',
        payment_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        client_product_id TEXT,
        client_id TEXT NOT NULL,
        order_id TEXT,
        reminder_type TEXT NOT NULL DEFAULT 'email',
        reminder_date TEXT NOT NULL,
        reminder_time TEXT DEFAULT '09:00',
        status TEXT DEFAULT 'pending',
        message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_product_id) REFERENCES client_products(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_logs (
        id TEXT PRIMARY KEY,
        reminder_id TEXT,
        client_id TEXT NOT NULL,
        order_id TEXT,
        sent_via TEXT,
        status TEXT DEFAULT 'sent',
        error_message TEXT,
        sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE SET NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'worker',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, product_type, description, unit_price, default_quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertProduct.run('1', 'Thermal Paper Roll 80mm', 'Thermal', 'Standard thermal paper roll 80mm width', 25.00, 100);
    insertProduct.run('2', 'Thermal Paper Roll 57mm', 'Thermal', 'Small thermal paper roll 57mm width', 15.00, 100);
    insertProduct.run('3', 'Bond Paper Roll A4', 'Bond', 'White bond paper roll A4 size', 35.00, 50);
    insertProduct.run('4', 'Kraft Paper Roll', 'Kraft', 'Brown kraft paper roll for packaging', 40.00, 50);
    insertProduct.run('5', 'POS Paper Roll', 'Thermal', 'POS thermal paper roll 80x80', 28.00, 100);
  }

  console.log('Database initialized');
};

initDb();

module.exports = db;