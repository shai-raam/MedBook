const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

const seed = async () => {
  try {
    console.log('🌱 Starting database seed...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('✅ Schema created');

    // Read and execute seed data
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    const seedData = fs.readFileSync(seedPath, 'utf-8');
    await pool.query(seedData);
    console.log('✅ Seed data inserted');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Default credentials:');
    console.log('  Admin: admin@hospital.com / Password@123');
    console.log('  Doctor: dr.sharma@hospital.com / Password@123');
    console.log('  Patient: patient1@example.com / Password@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();
