# MedBook - Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Patient  │ │  Doctor  │ │  Admin   │ │  Auth    │  │
│  │Dashboard │ │Dashboard │ │Dashboard │ │  Pages   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │             │            │             │        │
│  ┌────▼─────────────▼────────────▼─────────────▼────┐  │
│  │              API Service Layer (Axios)            │  │
│  └───────────────────────┬──────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────▼──────────────────────────────┐
│                 SERVER (Express.js)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │             Middleware Layer                       │  │
│  │  ┌──────┐ ┌──────┐ ┌─────────┐ ┌────────────┐  │  │
│  │  │ CORS │ │Helmet│ │Rate Limiter│ │JWT Auth    │  │  │
│  │  └──────┘ └──────┘ └─────────┘ └────────────┘  │  │
│  └──────────────────────┬───────────────────────────┘  │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │              Route Layer                          │  │
│  │ auth | appointments | doctors | payments | admin  │  │
│  │ availability | prescriptions | triage             │  │
│  └──────────────────────┬───────────────────────────┘  │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │            Controller Layer                       │  │
│  │  Request validation → Business logic → Response   │  │
│  └──────────────────────┬───────────────────────────┘  │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │             Service Layer                         │  │
│  │  ┌────────┐ ┌────────────┐ ┌──────────────┐     │  │
│  │  │Triage  │ │Scheduling  │ │No-Show       │     │  │
│  │  │Service │ │Service     │ │Prediction    │     │  │
│  │  └────────┘ └────────────┘ └──────────────┘     │  │
│  │  ┌────────┐ ┌────────────┐                       │  │
│  │  │Workload│ │Follow-Up   │                       │  │
│  │  │Balance │ │Suggestions │                       │  │
│  │  └────────┘ └────────────┘                       │  │
│  └──────────────────────┬───────────────────────────┘  │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │           Database Layer (pg)                     │  │
│  └──────────────────────┬───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  PostgreSQL Database                     │
│  users | doctors | patients | appointments              │
│  payments | prescriptions | availability | symptoms     │
│  notifications | audit_logs                             │
└─────────────────────────────────────────────────────────┘
```

## Design Patterns

### Clean Architecture
- **Routes** → Define endpoints and validation rules
- **Controllers** → Handle HTTP request/response
- **Services** → Business logic (reusable, testable)
- **Config** → Database and external service configuration

### Role-Based Access Control (RBAC)
- JWT tokens include user role
- `authorize()` middleware enforces role requirements
- Frontend routes protected by `ProtectedRoute` component

### Smart Features

#### 1. Triage System
Analyzes patient symptoms against a weighted database to:
- Determine urgency level (low/medium/high/emergency)
- Rank specializations by relevance score
- Recommend specific doctors

#### 2. Dynamic Scheduling
- Generates time slots from doctor availability templates
- Detects and prevents double bookings
- Provides AI-recommended optimal slots
- Propagates delays through the queue

#### 3. No-Show Prediction
Factors considered:
- Patient's historical no-show rate
- Day of week (weekends = higher risk)
- Time of day (early/late = higher risk)
- Confidence weighted by data volume

#### 4. Workload Balancing
- Distributes patients across doctors in same specialization
- Considers max daily capacity
- Factors in current utilization rate

#### 5. Auto Follow-Up Suggestions
- Condition-based rules (e.g., hypertension → 14 days)
- Tracks pending follow-ups
- Prevents duplicate follow-up bookings

## Database Design

### Entity Relationships
```
users (1) ─── (1) doctors
users (1) ─── (1) patients
doctors (1) ─── (N) availability
doctors (1) ─── (N) appointments
patients (1) ─── (N) appointments
appointments (1) ─── (1) payments
appointments (1) ─── (N) prescriptions
appointments (1) ─── (N) appointments (follow-ups)
```

### Key Design Decisions
- **UUID primary keys** for security (non-sequential)
- **JSONB columns** for flexible data (medications, test results)
- **Enum types** for status fields (compile-time safety)
- **Indexes** on frequently queried columns
- **Trigger-based** `updated_at` timestamps

## Payment Flow (Razorpay UPI)

```
1. Patient selects slot → POST /appointments (status: pending)
2. Frontend → POST /payments/create-order (creates Razorpay order)
3. Razorpay checkout opens → Patient pays via UPI
4. Razorpay callback → POST /payments/verify
5. Signature verified → Payment status: completed, Appointment status: confirmed
```

## Security Measures
- **Helmet** for HTTP headers
- **CORS** with whitelist
- **Rate limiting** (100 req/15min)
- **bcrypt** password hashing (12 rounds)
- **JWT** with configurable expiry
- **Input validation** via express-validator
- **SQL parameterization** (no raw interpolation)
