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

async function checkRoles() {
  try {
    const res = await pool.query('SELECT email, role FROM users');
    fs.writeFileSync('roles-debug.json', JSON.stringify(res.rows, null, 2), 'utf8');
    console.log('Results written to roles-debug.json');
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}

checkRoles();
