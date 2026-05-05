# MedBook API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST `/auth/register`
Register a new user (patient or doctor).

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210",
  "role": "patient"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "patient", "firstName": "John", "lastName": "Doe" },
    "token": "jwt_token"
  }
}
```

### POST `/auth/login`
**Body:** `{ "email": "...", "password": "..." }`
**Response:** `200 OK` with user data and token.

### GET `/auth/me` 🔒
Get current authenticated user profile.

### PUT `/auth/profile` 🔒
Update user profile.

---

## Doctor Endpoints

### GET `/doctors`
Search and list doctors. Public endpoint.

**Query Params:** `specialization`, `department`, `search`, `page`, `limit`

### GET `/doctors/specializations`
List all available specializations.

### GET `/doctors/:id`
Get doctor details by ID.

### GET `/doctors/:id/slots?date=YYYY-MM-DD`
Get available time slots for a doctor on a specific date.

**Response includes:** `slots[]` and `recommendedSlot` (AI-recommended best slot).

### GET `/doctors/specialization/:specialization?date=YYYY-MM-DD`
Get doctors by specialization with workload balancing (least loaded first).

### PUT `/doctors/profile` 🔒 (Doctor only)
Update doctor-specific profile.

---

## Appointment Endpoints

### POST `/appointments` 🔒 (Patient only)
Book a new appointment.

**Body:**
```json
{
  "doctorId": "uuid",
  "appointmentDate": "2025-01-15",
  "startTime": "10:00",
  "endTime": "10:20",
  "symptoms": "Chest pain, shortness of breath",
  "urgency": "medium"
}
```

### GET `/appointments` 🔒
List appointments (filtered by role automatically).

**Query Params:** `status`, `date`, `page`, `limit`

### GET `/appointments/:id` 🔒
Get single appointment details.

### PUT `/appointments/:id/status` 🔒 (Doctor/Admin)
Update appointment status.

**Body:** `{ "status": "confirmed|in_progress|completed|no_show", "notes": "...", "diagnosis": "..." }`

### PUT `/appointments/:id/cancel` 🔒 (Patient/Admin)
Cancel an appointment.

**Body:** `{ "reason": "Personal reasons" }`

### PUT `/appointments/:id/reschedule` 🔒 (Patient/Admin)
Reschedule an appointment.

**Body:** `{ "appointmentDate": "2025-01-20", "startTime": "11:00", "endTime": "11:20" }`

### GET `/appointments/queue/:doctorId/:date` 🔒
Get real-time queue for a doctor on a date.

---

## Payment Endpoints

### POST `/payments/create-order` 🔒 (Patient)
Create a Razorpay order for appointment payment.

**Body:** `{ "appointmentId": "uuid" }`
**Response:** `{ "orderId": "...", "amount": 100000, "currency": "INR", "keyId": "..." }`

### POST `/payments/verify` 🔒 (Patient)
Verify Razorpay payment after completion.

**Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature"
}
```

### GET `/payments/history` 🔒
Get payment history (role-based filtering).

### POST `/payments/:id/refund` 🔒 (Admin)
Initiate a refund for a completed payment.

---

## Prescription Endpoints

### POST `/prescriptions` 🔒 (Doctor)
Create a prescription for an appointment.

**Body:**
```json
{
  "appointmentId": "uuid",
  "diagnosis": "Hypertension Stage 1",
  "medications": [
    { "name": "Amlodipine", "dosage": "5mg", "frequency": "Once daily", "duration": "30 days" }
  ],
  "advice": "Reduce salt intake, regular exercise",
  "followUpRequired": true,
  "followUpDays": 14
}
```

### GET `/prescriptions/my` 🔒 (Patient)
Get patient's own prescriptions.

### GET `/prescriptions/patient/:patientId` 🔒 (Doctor/Admin)
Get prescriptions for a specific patient.

### GET `/prescriptions/:id` 🔒
Get prescription details.

---

## Availability Endpoints (Doctor only)

### GET `/availability` 🔒
Get doctor's availability schedule.

### POST `/availability` 🔒
Set/update availability.

**Body:**
```json
{
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "13:00",
  "slotDuration": 15
}
```

### DELETE `/availability/:id` 🔒
Remove an availability slot.

---

## Triage Endpoints

### GET `/triage/symptoms`
List all available symptoms for triage (public).

### POST `/triage/analyze` 🔒
Analyze symptoms and get doctor recommendations.

**Body:** `{ "symptoms": ["Chest Pain", "Shortness of Breath"] }`

**Response:**
```json
{
  "matchedSymptoms": ["Chest Pain", "Shortness of Breath"],
  "specializations": [{ "specialization": "Cardiology", "score": 2.9 }],
  "urgency": "high",
  "severityScore": 1.45,
  "recommendedDoctors": [...]
}
```

---

## Admin Endpoints (Admin only)

### GET `/admin/users` 🔒
List all users with search and role filter.

### PUT `/admin/users/:id/toggle` 🔒
Activate/deactivate a user account.

### GET `/admin/analytics` 🔒
Get system-wide analytics dashboard data.

### GET `/admin/emergency` 🔒
List pending emergency bookings.

### PUT `/admin/emergency/:id/approve` 🔒
Approve an emergency booking.

---

## Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Valid email is required" }]
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Rate Limited
- `500` - Internal Server Error
