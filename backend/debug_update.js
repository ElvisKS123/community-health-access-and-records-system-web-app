const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function debugUpdate() {
  const assignmentId = 1;
  const nextStatus = 'in_progress';
  const notes = 'Test note';
  const clinicId = null;
  const userId = 10;
  const role = 'receptionist';

  console.log('--- Testing Current Update Query ---');
  let query = `
    UPDATE assignments SET
      status = $1::text,
      notes = $2,
      completed_at = CASE WHEN $1::text = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE id = $3 AND clinic_id IS NOT DISTINCT FROM $4
  `;
  const params = [nextStatus, notes, assignmentId, clinicId];
  if (role === 'doctor') {
    query += ' AND doctor_id = $5';
    params.push(userId);
  }
  query += ' RETURNING *';

  try {
    const res = await pool.query(query, params);
    console.log('Success!');
    const fs = require('fs');
    fs.writeFileSync('debug_success.json', JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error('Update Failed!');
    const fs = require('fs');
    fs.writeFileSync('debug_error.json', JSON.stringify({ message: err.message, stack: err.stack }, null, 2));
  } finally {
    await pool.end();
  }
}

debugUpdate();
