const pool = require("./db");

const createTables = async () => {
  try {
    // Create users table for Authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'receptionist',
        department VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create clinics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinics (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        contact_person VARCHAR(255),
        license_number VARCHAR(100),
        password_hash VARCHAR(255),
        document_path VARCHAR(500),
        document_original_name VARCHAR(255),
        document_mimetype VARCHAR(100),
        document_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new clinic columns for existing records
    await pool.query(`
      ALTER TABLE clinics
        ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
        ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
        ADD COLUMN IF NOT EXISTS document_path VARCHAR(500),
        ADD COLUMN IF NOT EXISTS document_original_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS document_mimetype VARCHAR(100),
        ADD COLUMN IF NOT EXISTS document_size INTEGER;
    `);

    // Create patients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        gender VARCHAR(10) NOT NULL,
        phone VARCHAR(20),
        national_id VARCHAR(50) UNIQUE,
        address TEXT,
        insurance_number VARCHAR(100),
        insurance_provider VARCHAR(100),
        insurance_status VARCHAR(20) DEFAULT 'Active',
        last_visit DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_active column for existing records (if table already existed)
    await pool.query(`
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);

    // Ensure users table has is_active column for existing records
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
    `);

    // Create medical_records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        diagnosis TEXT,
        treatment TEXT,
        notes TEXT,
        doctor_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        record_id INTEGER NOT NULL,
        details_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create files table for storing file metadata
    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        path VARCHAR(500) NOT NULL,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'assigned',
        notes TEXT,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Ensure assignments table has completed_at column for existing records
    await pool.query(`
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
    `);

    // Create lab_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lab_results (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        test_type VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Ordered',
        result TEXT,
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clinical workflow: medications, allergies, immunizations, problem list
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        dosage VARCHAR(255),
        frequency VARCHAR(255),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'Active',
        notes TEXT,
        prescribed_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS allergies (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        allergen VARCHAR(255) NOT NULL,
        reaction VARCHAR(255),
        severity VARCHAR(50),
        notes TEXT,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS immunizations (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        vaccine VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        dose VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS problem_list (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        problem VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        onset_date DATE,
        resolved_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Emergency log
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergencies (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        priority VARCHAR(20) DEFAULT 'Normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE emergencies ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Normal';
    `);

    // Triage / queue table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS triage (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        weight_kg NUMERIC(6,2),
        height_cm NUMERIC(6,2),
        blood_pressure VARCHAR(20),
        temperature_c NUMERIC(4,1),
        pulse INTEGER,
        complaint TEXT,
        notes TEXT,
        status VARCHAR(30) DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE triage
        ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,2),
        ADD COLUMN IF NOT EXISTS height_cm NUMERIC(6,2),
        ADD COLUMN IF NOT EXISTS blood_pressure VARCHAR(20),
        ADD COLUMN IF NOT EXISTS temperature_c NUMERIC(4,1),
        ADD COLUMN IF NOT EXISTS pulse INTEGER,
        ADD COLUMN IF NOT EXISTS complaint TEXT,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'waiting';
    `);

    // Update tables to include clinic_id for multi-tenancy
    const tablesToUpdate = [
      'users',
      'patients',
      'medical_records',
      'audit_logs',
      'files',
      'assignments',
      'lab_results',
      'medications',
      'allergies',
      'immunizations',
      'problem_list',
      'emergencies',
      'triage',
    ];

    for (const table of tablesToUpdate) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE`);
    }

    console.log("Tables created and updated for multi-tenancy successfully");
  } catch (err) {
    console.error("Error creating tables:", err);
    throw err;
  }
};

module.exports = createTables;

if (require.main === module) {
  createTables().then(() => process.exit(0)).catch(() => process.exit(1));
}
