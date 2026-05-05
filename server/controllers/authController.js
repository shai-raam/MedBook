const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { email, password, firstName, lastName, phone, role = 'patient' } = req.body;

    // Check if user exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, first_name, last_name`,
      [email, passwordHash, role, firstName, lastName, phone]
    );

    const user = userResult.rows[0];

    // Create role-specific profile
    if (role === 'patient') {
      const { dateOfBirth, gender, bloodGroup, address, city, state, pincode } = req.body;
      await client.query(
        `INSERT INTO patients (user_id, date_of_birth, gender, blood_group, address, city, state, pincode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [user.id, dateOfBirth || null, gender || null, bloodGroup || null,
         address || null, city || null, state || null, pincode || null]
      );
    } else if (role === 'doctor') {
      const { specialization, qualification, experienceYears, consultationFee, department, licenseNumber } = req.body;
      await client.query(
        `INSERT INTO doctors (user_id, specialization, qualification, experience_years, consultation_fee, department, license_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, specialization, qualification, experienceYears || 0,
         consultationFee || 500, department || null, licenseNumber || null]
      );
    }

    await client.query('COMMIT');

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name },
        token,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);

    // Get role-specific profile ID
    let profileId = null;
    if (user.role === 'patient') {
      const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [user.id]);
      profileId = patientResult.rows[0]?.id;
    } else if (user.role === 'doctor') {
      const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [user.id]);
      profileId = doctorResult.rows[0]?.id;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          profileId,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, email, role, first_name, last_name, phone, avatar_url, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    let profile = null;

    if (user.role === 'patient') {
      const profileResult = await query('SELECT * FROM patients WHERE user_id = $1', [user.id]);
      profile = profileResult.rows[0];
    } else if (user.role === 'doctor') {
      const profileResult = await query('SELECT * FROM doctors WHERE user_id = $1', [user.id]);
      profile = profileResult.rows[0];
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
        },
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;

    await query(
      `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), phone = COALESCE($3, phone) WHERE id = $4`,
      [firstName, lastName, phone, req.user.id]
    );

    // Update role-specific profile
    if (req.user.role === 'patient') {
      const { dateOfBirth, gender, bloodGroup, address, city, state, pincode, allergies, emergencyContactName, emergencyContactPhone } = req.body;
      await query(
        `UPDATE patients SET 
          date_of_birth = COALESCE($1, date_of_birth),
          gender = COALESCE($2, gender),
          blood_group = COALESCE($3, blood_group),
          address = COALESCE($4, address),
          city = COALESCE($5, city),
          state = COALESCE($6, state),
          pincode = COALESCE($7, pincode),
          allergies = COALESCE($8, allergies),
          emergency_contact_name = COALESCE($9, emergency_contact_name),
          emergency_contact_phone = COALESCE($10, emergency_contact_phone)
        WHERE user_id = $11`,
        [dateOfBirth, gender, bloodGroup, address, city, state, pincode, allergies, emergencyContactName, emergencyContactPhone, req.user.id]
      );
    }

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile };
