-- ============================================
-- Hospital Appointment Booking System
-- Seed Data
-- ============================================
-- NOTE: Passwords are hashed using bcrypt. Default password for all users: "Password@123"
-- Hash: $2a$12$wzfKdcDu1UZPzidhhyM4XefhUQDMW93D3ebY5DFq79UGnjilOX8Ja

-- ============================================
-- ADMIN USER
-- ============================================
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active, email_verified)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin@hospital.com', '$2a$12$wzfKdcDu1UZPzidhhyM4XefhUQDMW93D3ebY5DFq79UGnjilOX8Ja', 'admin', 'System', 'Admin', '9000000001', true, true);

-- ============================================
-- DOCTOR USERS
-- ============================================
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active, email_verified)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'dr.sharma@hospital.com', '$2a$12$wzfKdcDu1UZPzidhhyM4XefhUQDMW93D3ebY5DFq79UGnjilOX8Ja', 'doctor', 'Rajesh', 'Sharma', '9100000001', true, true),
    ('d0000000-0000-0000-0000-000000000002', 'dr.patel@hospital.com', '$2a$12$wzfKdcDu1UZPzidhhyM4XefhUQDMW93D3ebY5DFq79UGnjilOX8Ja', 'doctor', 'Priya', 'Patel', '9100000002', true, true),
    ('d0000000-0000-0000-0000-000000000003', 'dr.kumar@hospital.com', '$2a$12$wzfKdcDu1UZPzidhhyM4XefhUQDMW93D3ebY5DFq79UGnjilOX8Ja', 'doctor', 'Arun', 'Kumar', '9100000003', true, true),
    ('d0000000-0000-0000-0000-000000000004', 'dr.gupta@hospital.com', '$2a$12$wzfKdcDu1UZPzidhhyM4XefhUQDMW93D3ebY5DFq79UGnjilOX8Ja', 'doctor', 'Sneha', 'Gupta', '9100000004', true, true),
    ('d0000000-0000-0000-0000-000000000005', 'dr.reddy@hospital.com', '$2a$12$wzfKdcDu1UZPzidhhyM4XefhUQDMW93D3ebY5DFq79UGnjilOX8Ja', 'doctor', 'Vikram', 'Reddy', '9100000005', true, true);

-- ============================================
-- DOCTOR PROFILES
-- ============================================
INSERT INTO doctors (id, user_id, specialization, qualification, experience_years, consultation_fee, bio, department, license_number, max_patients_per_day, avg_consultation_time)
VALUES
    ('dc000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Cardiology', 'MD, DM Cardiology (AIIMS)', 15, 1000.00, 'Senior Cardiologist with 15 years of experience in interventional cardiology and heart failure management.', 'Cardiology', 'MCI-2010-001', 20, 20),
    ('dc000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Dermatology', 'MD Dermatology (KEM)', 10, 800.00, 'Expert dermatologist specializing in cosmetic dermatology and skin cancer treatment.', 'Dermatology', 'MCI-2014-002', 25, 15),
    ('dc000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Orthopedics', 'MS Orthopedics, Fellowship Sports Medicine', 12, 900.00, 'Orthopedic surgeon with expertise in joint replacement and sports injuries.', 'Orthopedics', 'MCI-2012-003', 18, 20),
    ('dc000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'General Medicine', 'MD Internal Medicine (CMC Vellore)', 8, 600.00, 'Internal medicine specialist with focus on diabetes and metabolic disorders.', 'General Medicine', 'MCI-2016-004', 30, 15),
    ('dc000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'Neurology', 'DM Neurology (NIMHANS)', 20, 1200.00, 'Senior neurologist specializing in epilepsy, stroke, and neurodegenerative disorders.', 'Neurology', 'MCI-2004-005', 15, 25);

-- ============================================
-- PATIENT USERS
-- ============================================
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active, email_verified)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'patient1@example.com', '$2a$12$wzfKdcDu1UZPzidhhyM4XefhUQDMW93D3ebY5DFq79UGnjilOX8Ja', 'patient', 'Amit', 'Singh', '9200000001', true, true),
    ('b0000000-0000-0000-0000-000000000002', 'patient2@example.com', '$2a$12$wzfKdcDu1UZPzidhhyM4XefhUQDMW93D3ebY5DFq79UGnjilOX8Ja', 'patient', 'Neha', 'Verma', '9200000002', true, true);

-- ============================================
-- PATIENT PROFILES
-- ============================================
INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, address, city, state, pincode, emergency_contact_name, emergency_contact_phone)
VALUES
    ('bc000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '1990-05-15', 'male', 'O+', '123 MG Road', 'Mumbai', 'Maharashtra', '400001', 'Ravi Singh', '9300000001'),
    ('bc000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '1988-09-20', 'female', 'B+', '456 Park Street', 'Delhi', 'Delhi', '110001', 'Suresh Verma', '9300000002');

-- ============================================
-- AVAILABILITY (Doctor Schedules)
-- ============================================
-- Dr. Sharma (Cardiology) - Mon to Fri, 9AM-1PM and 2PM-5PM
INSERT INTO availability (doctor_id, day_of_week, start_time, end_time, slot_duration)
VALUES
    ('dc000000-0000-0000-0000-000000000001', 'monday', '09:00', '13:00', 20),
    ('dc000000-0000-0000-0000-000000000001', 'monday', '14:00', '17:00', 20),
    ('dc000000-0000-0000-0000-000000000001', 'tuesday', '09:00', '13:00', 20),
    ('dc000000-0000-0000-0000-000000000001', 'wednesday', '09:00', '13:00', 20),
    ('dc000000-0000-0000-0000-000000000001', 'thursday', '09:00', '13:00', 20),
    ('dc000000-0000-0000-0000-000000000001', 'friday', '09:00', '13:00', 20);

-- Dr. Patel (Dermatology) - Mon, Wed, Fri, 10AM-4PM
INSERT INTO availability (doctor_id, day_of_week, start_time, end_time, slot_duration)
VALUES
    ('dc000000-0000-0000-0000-000000000002', 'monday', '10:00', '16:00', 15),
    ('dc000000-0000-0000-0000-000000000002', 'wednesday', '10:00', '16:00', 15),
    ('dc000000-0000-0000-0000-000000000002', 'friday', '10:00', '16:00', 15);

-- Dr. Kumar (Orthopedics) - Tue, Thu, Sat, 9AM-2PM
INSERT INTO availability (doctor_id, day_of_week, start_time, end_time, slot_duration)
VALUES
    ('dc000000-0000-0000-0000-000000000003', 'tuesday', '09:00', '14:00', 20),
    ('dc000000-0000-0000-0000-000000000003', 'thursday', '09:00', '14:00', 20),
    ('dc000000-0000-0000-0000-000000000003', 'saturday', '09:00', '14:00', 20);

-- Dr. Gupta (General Medicine) - Mon to Sat, 8AM-12PM
INSERT INTO availability (doctor_id, day_of_week, start_time, end_time, slot_duration)
VALUES
    ('dc000000-0000-0000-0000-000000000004', 'monday', '08:00', '12:00', 15),
    ('dc000000-0000-0000-0000-000000000004', 'tuesday', '08:00', '12:00', 15),
    ('dc000000-0000-0000-0000-000000000004', 'wednesday', '08:00', '12:00', 15),
    ('dc000000-0000-0000-0000-000000000004', 'thursday', '08:00', '12:00', 15),
    ('dc000000-0000-0000-0000-000000000004', 'friday', '08:00', '12:00', 15),
    ('dc000000-0000-0000-0000-000000000004', 'saturday', '08:00', '12:00', 15);

-- Dr. Reddy (Neurology) - Mon, Wed, Fri, 11AM-5PM
INSERT INTO availability (doctor_id, day_of_week, start_time, end_time, slot_duration)
VALUES
    ('dc000000-0000-0000-0000-000000000005', 'monday', '11:00', '17:00', 25),
    ('dc000000-0000-0000-0000-000000000005', 'wednesday', '11:00', '17:00', 25),
    ('dc000000-0000-0000-0000-000000000005', 'friday', '11:00', '17:00', 25);

-- ============================================
-- SYMPTOMS (for smart triage)
-- ============================================
INSERT INTO symptoms (name, category, severity_weight, suggested_specializations)
VALUES
    ('Chest Pain', 'Cardiac', 1.50, ARRAY['Cardiology', 'General Medicine']),
    ('Palpitations', 'Cardiac', 1.20, ARRAY['Cardiology']),
    ('Shortness of Breath', 'Cardiac', 1.40, ARRAY['Cardiology', 'General Medicine']),
    ('High Blood Pressure', 'Cardiac', 1.10, ARRAY['Cardiology', 'General Medicine']),
    ('Skin Rash', 'Dermatological', 0.80, ARRAY['Dermatology']),
    ('Acne', 'Dermatological', 0.60, ARRAY['Dermatology']),
    ('Hair Loss', 'Dermatological', 0.50, ARRAY['Dermatology']),
    ('Itching', 'Dermatological', 0.70, ARRAY['Dermatology', 'General Medicine']),
    ('Joint Pain', 'Musculoskeletal', 0.90, ARRAY['Orthopedics', 'General Medicine']),
    ('Back Pain', 'Musculoskeletal', 0.85, ARRAY['Orthopedics', 'Neurology']),
    ('Fracture', 'Musculoskeletal', 1.30, ARRAY['Orthopedics']),
    ('Sports Injury', 'Musculoskeletal', 1.00, ARRAY['Orthopedics']),
    ('Headache', 'Neurological', 0.80, ARRAY['Neurology', 'General Medicine']),
    ('Dizziness', 'Neurological', 0.90, ARRAY['Neurology', 'General Medicine']),
    ('Seizures', 'Neurological', 1.50, ARRAY['Neurology']),
    ('Numbness', 'Neurological', 1.00, ARRAY['Neurology']),
    ('Memory Loss', 'Neurological', 1.10, ARRAY['Neurology']),
    ('Fever', 'General', 0.70, ARRAY['General Medicine']),
    ('Cold and Cough', 'General', 0.50, ARRAY['General Medicine']),
    ('Fatigue', 'General', 0.60, ARRAY['General Medicine']),
    ('Weight Loss', 'General', 0.80, ARRAY['General Medicine']),
    ('Diabetes', 'Metabolic', 1.00, ARRAY['General Medicine']),
    ('Stomach Pain', 'Gastrointestinal', 0.80, ARRAY['General Medicine']),
    ('Nausea', 'Gastrointestinal', 0.60, ARRAY['General Medicine']);
