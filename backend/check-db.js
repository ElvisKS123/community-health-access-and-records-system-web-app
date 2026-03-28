const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const fs = require('fs');

async function checkUsers() {
  let output = '';
  try {
    const res = await pool.query('SELECT id, email, role, clinic_id FROM users');
    output += '--- USERS TABLE ---\n';
    output += JSON.stringify(res.rows, null, 2) + '\n';
    
    const clinics = await pool.query('SELECT id, name FROM clinics');
    output += '\n--- CLINICS TABLE ---\n';
    output += JSON.stringify(clinics.rows, null, 2) + '\n';
    
    const assignments = await pool.query('SELECT * FROM assignments');
    output += '\n--- ASSIGNMENTS TABLE ---\n';
    output += JSON.stringify(assignments.rows, null, 2) + '\n';
    
    fs.writeFileSync('db-debug.json', output, 'utf8');
    console.log('Results written to db-debug.json');
    
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}

checkUsers();
