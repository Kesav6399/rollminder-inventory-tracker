# RollMinder - Paper Roll Inventory & Reminder App

A full-stack B2B paper/bill roll supply management application with automatic reminders for paper roll, bill roll, and thermal roll businesses.

## Project Structure

```
paper-roll-inventory/
├── database/
│   └── schema.sql          # PostgreSQL schema
├── backend/
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── src/
│       ├── config/
│       │   └── database.js # PostgreSQL connection
│       ├── routes/
│       │   ├── clients.js
│       │   ├── products.js
│       │   ├── orders.js
│       │   ├── dashboard.js
│       │   ├── bills.js
│       │   └── reminders.js
│       ├── services/
│       │   └── alertService.js
│       ├── jobs/
│       │   └── reminderJob.js
│       └── server.js
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── index.css
        ├── App.js
        ├── services/
        │   └── api.js
        └── pages/
            ├── Dashboard.js
            ├── Clients.js
            ├── ClientDetail.js
            ├── Products.js
            ├── Bills.js
            ├── Reminders.js
            └── Login.js
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup Instructions

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb paper_roll_inventory

# Run the schema (from database folder)
psql -U postgres -d paper_roll_inventory -f schema.sql
```

Or use pgAdmin/Adminer to:
1. Create a new database named `paper_roll_inventory`
2. Run the SQL from `database/schema.sql`

### 2. Backend Setup

```bash
cd backend

# Copy environment variables
copy .env.example .env

# Edit .env with your credentials
# DB_PASSWORD=your_postgres_password
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password

# Install dependencies
npm install

# Start development server
npm run dev
```

The API will run on http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at http://localhost:3000

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=paper_roll_inventory
DB_USER=postgres
DB_PASSWORD=your_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
REMINDER_DAYS_BEFORE=3
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## API Endpoints

### Clients
- `GET /api/clients` - List all clients (with search)
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/client/:clientId` - Get orders for a client
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order

### Bills
- `GET /api/bills` - List all bills (with filter by status)
- `POST /api/bills` - Create new bill
- `PUT /api/bills/:id` - Update bill
- `PUT /api/bills/:id/pay` - Mark bill as paid

### Reminders
- `GET /api/reminders` - List all reminders
- `GET /api/reminders/upcoming` - Get upcoming reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/:id` - Update reminder
- `PUT /api/reminders/:id/complete` - Mark as completed

### Dashboard
- `GET /api/dashboard/upcoming-reminders` - Get upcoming deliveries
- `GET /api/dashboard/summary` - Get summary statistics

## Features

### Dashboard
- Total clients, products, orders
- Due today / Overdue counts
- Unpaid bills count
- Pending reminders
- Upcoming deliveries table

### Client Management
- Add unlimited clients
- Client name, contact person, phone, email, address
- GST number support
- Notes field

### Product Management
- Dynamic product types (Thermal, Bond, Kraft, etc.)
- Default quantity
- Unit price tracking

### Client Products
- Track products supplied to each client
- Delivery frequency
- Reminder settings (days before, time, type)

### Orders/Deliveries
- Log every delivery
- Track quantity, price, total amount
- Payment status (paid/unpaid)
- Bill number

### Bills & Payments
- Create bills for clients
- Track paid/unpaid status
- Payment date tracking

### Reminders
- Multiple reminders per client
- Email, SMS, App notification types
- Custom reminder date/time
- Mark as completed

### Login
- Demo: admin@rollminder.com / admin123

## Cron Job

The reminder job runs daily at 9:00 AM and:
1. Finds orders expiring soon
2. Checks for duplicate reminders
3. Sends email and SMS alerts
4. Logs reminders to the database

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express.js, node-cron
- **Database**: PostgreSQL with node-postgres
- **Email**: Nodemailer
- **SMS**: Twilio (placeholder)