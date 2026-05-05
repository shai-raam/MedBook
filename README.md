# 🏥 MedBook - Hospital Appointment Booking System

![Login Screen](screenshots/login.png)

A full-stack hospital appointment booking system with intelligent features, real-time updates, and UPI-based payment integration.

## ✨ Features

### Patient Portal
![Patient Dashboard](screenshots/patient-dashboard.png)
![Booking Flow](screenshots/booking-flow.png)
- 🔍 Search doctors by name, specialization, or department
- 📅 Book appointments with a clean 3-step flow
- 🧠 Smart Triage - AI-powered symptom analysis & doctor recommendation
- 💳 UPI payment via Razorpay before confirmation
- 📊 Real-time queue position tracking
- 📋 View prescriptions and medical history
- ❌ Cancel or reschedule appointments

### Doctor Dashboard
![Doctor Dashboard](screenshots/doctor-dashboard.png)
- 📋 Today's appointment queue management
- ✅ Confirm, start, complete, or mark no-show
- 📝 Create prescriptions with medications and follow-up suggestions
- ⏰ Manage availability schedule
- 👥 View patient history

### Admin Panel
![Admin Dashboard](screenshots/admin-dashboard.png)
- 👥 User management (activate/deactivate accounts)
- 📊 Analytics dashboard (revenue, appointments, workload)
- 🚨 Emergency booking approval
- 💰 Payment monitoring

### Advanced Features
- **Smart Triage System** - Symptom → Specialization mapping with severity scoring
- **Dynamic Scheduling** - Slot generation, delay handling, optimal slot recommendation
- **No-Show Prediction** - ML-based probability scoring using historical data
- **Workload Balancing** - Even distribution of patients across doctors
- **Auto Follow-Up Suggestions** - Condition-based follow-up recommendations

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3 |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| Payments | Razorpay (UPI) |
| Icons | Lucide React |

## 📁 Project Structure

```
hospital-booking-system/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API service layer
│   │   ├── context/            # React context (Auth)
│   │   ├── App.jsx             # Main app with routing
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                     # Backend (Express.js)
│   ├── controllers/            # Request handlers
│   ├── routes/                 # Route definitions
│   ├── services/               # Business logic
│   ├── middleware/              # Auth, validation, error handling
│   ├── config/                 # DB and Razorpay config
│   ├── utils/                  # Seed script
│   ├── server.js               # Express app
│   └── package.json
│
├── database/
│   ├── schema.sql              # PostgreSQL schema
│   └── seed.sql                # Sample data
│
├── docs/
│   ├── api-docs.md             # API documentation
│   └── architecture.md         # System architecture
│
├── .env.example                # Environment variables template
├── docker-compose.yml          # Docker setup
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org))
- **PostgreSQL** v14+ ([Download](https://www.postgresql.org/download/))
- **npm** (comes with Node.js)

### 1. Clone and Setup

```bash
# Navigate to the project
cd hospital-booking-system

# Copy environment file
cp .env.example server/.env
```

### 2. Configure Environment

Edit `server/.env` with your values:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hospital_booking
JWT_SECRET=your_secret_key_here
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 3. Setup Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE hospital_booking;"

# Run schema
psql -U postgres -d hospital_booking -f database/schema.sql

# Run seed data
psql -U postgres -d hospital_booking -f database/seed.sql
```

Or use the seed script:
```bash
cd server
npm install
npm run seed
```

### 4. Start Backend

```bash
cd server
npm install
npm run dev
```
Server runs at `http://localhost:5000`

### 5. Start Frontend

```bash
cd client
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

### 6. Access the Application

Open `http://localhost:5173` in your browser.

#### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | Password@123 |
| Doctor | dr.sharma@hospital.com | Password@123 |
| Doctor | dr.patel@hospital.com | Password@123 |
| Patient | patient1@example.com | Password@123 |
| Patient | patient2@example.com | Password@123 |

## 🐳 Docker Setup (Optional)

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 with the database pre-configured.

## 💳 Razorpay Setup

1. Create a [Razorpay account](https://razorpay.com)
2. Get your **Test** API keys from Dashboard → Settings → API Keys
3. Add them to your `.env` file
4. The frontend loads the Razorpay checkout script automatically

> **Note:** In demo mode, if Razorpay keys are not configured, appointments will be booked without payment.

## 📖 API Documentation

See [docs/api-docs.md](docs/api-docs.md) for complete API reference.

### Key Endpoints
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/doctors` - Search doctors
- `GET /api/doctors/:id/slots?date=YYYY-MM-DD` - Get available slots
- `POST /api/appointments` - Book appointment
- `POST /api/payments/create-order` - Create payment order
- `POST /api/triage/analyze` - Smart symptom analysis

## 🏗 Architecture

See [docs/architecture.md](docs/architecture.md) for detailed system design.

## 📝 License

MIT License - Free for educational and commercial use.
