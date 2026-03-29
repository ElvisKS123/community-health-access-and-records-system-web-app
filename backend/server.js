const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("./db");
const createTables = require("./initDb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { authMiddleware, permit } = require("./middleware/auth");
const validate = require("./middleware/validate");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});

// Note: do not expose uploads publicly; serve via authenticated endpoints instead.

// Schemas
const patientSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dob: z.string().min(1, "DOB is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceStatus: z.string().optional(),
  lastVisit: z.string().optional().or(z.literal(''))
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = loginSchema.extend({
  role: z.enum(["admin", "doctor", "receptionist"]).optional(),
  department: z.string().optional(),
  fullName: z.string().optional()
});

const userStatusSchema = z.object({
  isActive: z.boolean()
});

const userRoleSchema = z.object({
  role: z.enum(["admin", "doctor", "receptionist"])
});

const resetPasswordSchema = z.object({
  password: z.string().min(6)
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6)
});

const clinicSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  contactPerson: z.string().min(1),
  licenseNumber: z.string().min(1),
  password: z.string().min(6)
});

const recordSchema = z.object({
  date: z.string().min(1),
  diagnosis: z.string().min(1),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  doctorName: z.string().optional()
});

const assignmentSchema = z.object({
  patientId: z.union([z.string(), z.number()]),
  doctorId: z.union([z.string(), z.number()]),
  status: z.string().optional(),
  notes: z.string().optional()
});

const updateAssignmentSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional()
});

const labSchema = z.object({
  patientId: z.union([z.string(), z.number()]),
  testType: z.string().min(1),
  status: z.string().optional(),
  result: z.string().nullable().optional()
});

const medicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  status: z.string().optional(),
  notes: z.string().optional(),
  prescribedBy: z.string().optional()
});

const allergySchema = z.object({
  allergen: z.string().min(1),
  reaction: z.string().optional(),
  severity: z.string().optional(),
  notes: z.string().optional()
});

const immunizationSchema = z.object({
  vaccine: z.string().min(1),
  date: z.string().min(1),
  dose: z.string().optional(),
  notes: z.string().optional()
});

const problemSchema = z.object({
  problem: z.string().min(1),
  status: z.string().optional(),
  onsetDate: z.string().optional().or(z.literal('')),
  resolvedDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional()
});

const emergencySchema = z.object({
  patientId: z.union([z.string(), z.number()]).optional(),
  description: z.string().min(1),
  priority: z.string().optional()
});

const triageSchema = z.object({
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  bloodPressure: z.string().optional(),
  temperatureC: z.number().optional(),
  pulse: z.number().optional(),
  complaint: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional()
});

const triageStatusSchema = z.object({
  status: z.string().min(1)
});

// Helper for Audit Logs
const logAudit = async (userId, action, tableName, recordId, details, clinicId) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, details_json, clinic_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, action, tableName, recordId, JSON.stringify(details), clinicId || null]
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

const ensurePatientInClinic = async (patientId, clinicId) => {
  const result = await pool.query(
    "SELECT id FROM patients WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 AND is_active = true",
    [patientId, clinicId]
  );
  return result.rows.length > 0;
};

const ensureDoctorInClinic = async (doctorId, clinicId) => {
  const result = await pool.query(
    "SELECT id FROM users WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 AND role = 'doctor' AND is_active = true",
    [doctorId, clinicId]
  );
  return result.rows.length > 0;
};

const seedAdminIfNeeded = async () => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return;
  const countRes = await pool.query("SELECT COUNT(*) FROM users");
  if (parseInt(countRes.rows[0].count) > 0) return;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  await pool.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)",
    [email, hash, 'admin']
  );
  console.log("Seeded initial admin user");
};

// Root
app.get("/", (req, res) => res.json({ message: "Welcome to Community Health API" }));

// Auth Routes
app.post("/api/auth/register", authMiddleware, permit('admin', 'receptionist'), validate(registerSchema), async (req, res) => {
  try {
    const { email, password, role, department, fullName } = req.body;
    const userRole = role || 'receptionist';
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role, department, clinic_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, email, role, department, created_at, clinic_id",
      [fullName || null, email, hash, userRole, department || null, req.user ? req.user.clinicId : null]
    );
    // Explicitly update logAudit call if needed, but it's handled below

    const token = jwt.sign(
      { id: result.rows[0].id, role: result.rows[0].role, clinicId: result.rows[0].clinic_id }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );
    res.status(201).json({ token, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });
    
    const user = userResult.rows[0];
    if (user.is_active === false) return res.status(403).json({ error: "Account is deactivated" });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role, clinicId: user.clinic_id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, department: user.department, clinicId: user.clinic_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/change-password", authMiddleware, validate(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2", [req.user.id, req.user.clinicId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, user.id]);
    await logAudit(req.user.id, 'UPDATE', 'users', user.id, { note: 'Password changed' }, req.user.clinicId);
    res.json({ message: "Password updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Users & Audit Logs
app.get("/api/users", authMiddleware, permit('admin', 'receptionist'), async (req, res) => {
  try {
    let query = "SELECT id, full_name, email, role, department, is_active, created_at FROM users WHERE clinic_id IS NOT DISTINCT FROM $1";
    const params = [req.user.clinicId];
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/users/:id/status", authMiddleware, permit('admin', 'receptionist'), validate(userStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const result = await pool.query(
      "UPDATE users SET is_active = $1 WHERE id = $2 AND clinic_id IS NOT DISTINCT FROM $3 RETURNING id, email, role, is_active",
      [isActive, id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    await logAudit(req.user.id, 'UPDATE', 'users', id, { is_active: isActive }, req.user.clinicId);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/users/:id/role", authMiddleware, permit('admin', 'receptionist'), validate(userRoleSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 AND clinic_id IS NOT DISTINCT FROM $3 RETURNING id, email, role, is_active",
      [role, id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    await logAudit(req.user.id, 'UPDATE', 'users', id, { role }, req.user.clinicId);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/users/:id/reset-password", authMiddleware, permit('admin', 'receptionist'), validate(resetPasswordSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const result = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2 AND clinic_id IS NOT DISTINCT FROM $3 RETURNING id, email, role, is_active",
      [hash, id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    await logAudit(req.user.id, 'UPDATE', 'users', id, { note: 'Password reset by staff' }, req.user.clinicId);
    res.json({ message: "Password reset", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/users/:id", authMiddleware, permit('admin', 'receptionist'), async (req, res) => {
  try {
    const { id } = req.params;
    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 RETURNING id, email",
      [id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    await logAudit(req.user.id, 'DELETE', 'users', id, { note: 'User deleted' }, req.user.clinicId);
    res.json({ message: "User deleted successfully", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/doctors", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, department, is_active FROM users WHERE role = 'doctor' AND clinic_id IS NOT DISTINCT FROM $1 ORDER BY created_at DESC",
      [req.user.clinicId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/audit-logs", authMiddleware, permit('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.clinic_id IS NOT DISTINCT FROM $1
      ORDER BY a.created_at DESC
      LIMIT 200
    `, [req.user.clinicId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Settings / Clinics
app.post("/api/clinics/register", upload.single('document'), validate(clinicSchema), async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, phone, address, contactPerson, licenseNumber, password } = req.body;
    const doc = req.file;
    const relPath = doc ? `uploads/${doc.filename}` : null;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO clinics 
        (name, email, phone, address, contact_person, license_number, password_hash, document_path, document_original_name, document_mimetype, document_size) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        name,
        email,
        phone,
        address,
        contactPerson,
        licenseNumber,
        passwordHash,
        relPath,
        doc ? doc.originalname : null,
        doc ? doc.mimetype : null,
        doc ? doc.size : null
      ]
    );

    // Also create a user account for the clinic admin to allow login
    const userRole = 'admin';
    await client.query(
      "INSERT INTO users (full_name, email, password_hash, role, clinic_id) VALUES ($1, $2, $3, $4, $5)",
      [contactPerson, email, passwordHash, userRole, result.rows[0].id]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error("Clinic registration rollback failed:", rollbackErr);
    }
    console.error("Clinic registration failed:", err);
    if (err.code === '23505') return res.status(409).json({ error: 'Clinic with this email already exists.' });
    res.status(500).json({ error: err.message || "Server error" });
  } finally {
    client.release();
  }
});

// Patients CRUD
// Now paginated, searchable and soft-delete aware
app.get("/api/patients", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', includeInactive = 'false', status, insuranceStatus, lastVisitFrom, lastVisitTo } = req.query;
    const offset = (page - 1) * limit;

    const clinicId = req.user.clinicId;

    const includeAll = String(includeInactive).toLowerCase() === 'true';
    let query = "SELECT * FROM patients WHERE clinic_id IS NOT DISTINCT FROM $1";
    let countQuery = "SELECT COUNT(*) FROM patients WHERE clinic_id IS NOT DISTINCT FROM $1";
    if (!includeAll) {
      query += " AND is_active = true";
      countQuery += " AND is_active = true";
    }
    let params = [clinicId];
    let countParams = [clinicId];

    if (status === 'active' || status === 'inactive') {
      const isActive = status === 'active';
      query += ` AND is_active = $${params.length + 1}`;
      countQuery += ` AND is_active = $${countParams.length + 1}`;
      params.push(isActive);
      countParams.push(isActive);
    }

    if (insuranceStatus) {
      query += ` AND insurance_status = $${params.length + 1}`;
      countQuery += ` AND insurance_status = $${countParams.length + 1}`;
      params.push(insuranceStatus);
      countParams.push(insuranceStatus);
    }

    if (lastVisitFrom) {
      query += ` AND last_visit >= $${params.length + 1}`;
      countQuery += ` AND last_visit >= $${countParams.length + 1}`;
      params.push(lastVisitFrom);
      countParams.push(lastVisitFrom);
    }

    if (lastVisitTo) {
      query += ` AND last_visit <= $${params.length + 1}`;
      countQuery += ` AND last_visit <= $${countParams.length + 1}`;
      params.push(lastVisitTo);
      countParams.push(lastVisitTo);
    }

    if (search) {
      query += ` AND (full_name ILIKE $${params.length + 1} OR national_id ILIKE $${params.length + 1})`;
      countQuery += ` AND (full_name ILIKE $${countParams.length + 1} OR national_id ILIKE $${countParams.length + 1})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/patients/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM patients WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 AND is_active = true", [id, req.user.clinicId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/patients", authMiddleware, validate(patientSchema), async (req, res) => {
  try {
    const {
      fullName, dob, gender, phone, nationalId, address,
      insuranceNumber, insuranceProvider, insuranceStatus, lastVisit
    } = req.body;
    
    const processedLastVisit = lastVisit === '' ? null : lastVisit;
    const result = await pool.query(
      `INSERT INTO patients (full_name, dob, gender, phone, national_id, address, insurance_number, insurance_provider, insurance_status, last_visit, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [fullName, dob, gender, phone, nationalId, address, insuranceNumber, insuranceProvider, insuranceStatus, processedLastVisit, req.user.clinicId]
    );

    const newPatient = result.rows[0];
    await logAudit(req.user.id, 'CREATE', 'patients', newPatient.id, { new_data: newPatient }, req.user.clinicId);

    res.status(201).json(newPatient);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'A patient with this national ID already exists.' });
    res.status(500).json({ error: err.message || "Server error" });
  }
});

app.put("/api/patients/:id", authMiddleware, validate(patientSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName, dob, gender, phone, nationalId, address,
      insuranceNumber, insuranceProvider, insuranceStatus, lastVisit
    } = req.body;

    // Get old data for audit
    const oldRes = await pool.query(
      "SELECT * FROM patients WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 AND is_active = true",
      [id, req.user.clinicId]
    );
    if (oldRes.rows.length === 0) return res.status(404).json({ error: "Patient not found" });

    const processedLastVisit = lastVisit === '' ? null : lastVisit;
    const result = await pool.query(
      `UPDATE patients SET
       full_name = $1, dob = $2, gender = $3, phone = $4, national_id = $5,
       address = $6, insurance_number = $7, insurance_provider = $8,
       insurance_status = $9, last_visit = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND clinic_id IS NOT DISTINCT FROM $12 RETURNING *`,
      [fullName, dob, gender, phone, nationalId, address, insuranceNumber, insuranceProvider, insuranceStatus, processedLastVisit, id, req.user.clinicId]
    );

    await logAudit(req.user.id, 'UPDATE', 'patients', id, { old_data: oldRes.rows[0], new_data: result.rows[0] }, req.user.clinicId);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/patients/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("UPDATE patients SET is_active = false WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 RETURNING *", [id, req.user.clinicId]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Patient not found" });

    await logAudit(req.user.id, 'DELETE', 'patients', id, { note: 'Soft deleted' }, req.user.clinicId);
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Patient status toggle (activate/deactivate)
app.put("/api/patients/:id/status", authMiddleware, permit('admin', 'receptionist'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return res.status(400).json({ error: "isActive must be boolean" });
    const result = await pool.query(
      "UPDATE patients SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND clinic_id IS NOT DISTINCT FROM $3 RETURNING *",
      [isActive, id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    await logAudit(req.user.id, 'UPDATE', 'patients', id, { is_active: isActive }, req.user.clinicId);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// National ID pre-check
app.get("/api/patients/check-national-id", authMiddleware, async (req, res) => {
  try {
    const { value } = req.query;
    if (!value) return res.json({ exists: false });
    const result = await pool.query(
      "SELECT id FROM patients WHERE national_id = $1 AND clinic_id IS NOT DISTINCT FROM $2",
      [value, req.user.clinicId]
    );
    res.json({ exists: result.rows.length > 0, id: result.rows[0]?.id || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Medical Records
app.get("/api/records", authMiddleware, permit('doctor', 'admin'), async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    let result;

    if (req.user.role === 'doctor') {
      const userRes = await pool.query(
        "SELECT full_name, email FROM users WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2",
        [req.user.id, clinicId]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const doctorFullName = userRes.rows[0].full_name;
      const doctorEmail = userRes.rows[0].email;

      result = await pool.query(`
        SELECT m.*, p.full_name as patient_name, p.id as patient_id
        FROM medical_records m
        JOIN patients p ON m.patient_id = p.id
        WHERE p.is_active = true
          AND m.clinic_id IS NOT DISTINCT FROM $1
          AND (
            EXISTS (
              SELECT 1
              FROM assignments a
              WHERE a.patient_id = m.patient_id
                AND a.doctor_id = $2
                AND a.clinic_id IS NOT DISTINCT FROM $1
            )
            OR m.doctor_name = $3
            OR m.doctor_name = $4
          )
        ORDER BY m.date DESC, m.created_at DESC
      `, [clinicId, req.user.id, doctorFullName || null, doctorEmail]);
    } else {
      result = await pool.query(`
        SELECT m.*, p.full_name as patient_name, p.id as patient_id
        FROM medical_records m
        JOIN patients p ON m.patient_id = p.id
        WHERE p.is_active = true AND m.clinic_id IS NOT DISTINCT FROM $1
        ORDER BY m.date DESC, m.created_at DESC
      `, [clinicId]);
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/patients/:patientId/records", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const result = await pool.query(`
      SELECT m.* FROM medical_records m
      JOIN patients p ON m.patient_id = p.id
      WHERE p.id = $1 AND p.is_active = true AND m.clinic_id IS NOT DISTINCT FROM $2
      ORDER BY m.date DESC
    `, [patientId, req.user.clinicId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/patients/:patientId/records", authMiddleware, validate(recordSchema), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { date, diagnosis, treatment, notes, doctorName } = req.body;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });

    const reqDoctor = doctorName || (req.user ? `User ${req.user.id}` : 'Unknown');

    const result = await pool.query(
      `INSERT INTO medical_records (patient_id, date, diagnosis, treatment, notes, doctor_name, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [patientId, date, diagnosis, treatment, notes, reqDoctor, req.user.clinicId]
    );

    await logAudit(req.user.id, 'CREATE', 'medical_records', result.rows[0].id, { new_data: result.rows[0] }, req.user.clinicId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Doctor Assignments
app.get("/api/doctor/assignments", authMiddleware, permit('doctor', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.full_name as patient_name, p.dob, p.gender
      FROM assignments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = $1 AND a.clinic_id IS NOT DISTINCT FROM $2 AND p.is_active = true
      ORDER BY a.assigned_at DESC
    `, [req.user.id, req.user.clinicId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Doctor-specific patient list (based on assignments)
app.get("/api/doctor/patients", authMiddleware, permit('doctor', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT p.*
      FROM patients p
      JOIN assignments a ON a.patient_id = p.id
      WHERE a.doctor_id = $1 AND a.clinic_id IS NOT DISTINCT FROM $2 AND p.is_active = true
      ORDER BY p.created_at DESC
    `, [req.user.id, req.user.clinicId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/assignments", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.full_name as patient_name, u.email as doctor_email, u.full_name as doctor_name, u.department as doctor_department
      FROM assignments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE a.clinic_id IS NOT DISTINCT FROM $1
      ORDER BY a.assigned_at DESC
    `, [req.user.clinicId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/assignments", authMiddleware, permit('admin', 'receptionist'), validate(assignmentSchema), async (req, res) => {
  try {
    const { patientId, doctorId, status, notes } = req.body;
    const [patientOk, doctorOk] = await Promise.all([
      ensurePatientInClinic(patientId, req.user.clinicId),
      ensureDoctorInClinic(doctorId, req.user.clinicId)
    ]);
    if (!patientOk) return res.status(404).json({ error: "Patient not found" });
    if (!doctorOk) return res.status(404).json({ error: "Doctor not found" });
    const result = await pool.query(
      `INSERT INTO assignments (patient_id, doctor_id, status, notes, clinic_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patientId, doctorId, status || 'assigned', notes || null, req.user.clinicId]
    );
    await logAudit(req.user.id, 'CREATE', 'assignments', result.rows[0].id, { new_data: result.rows[0] }, req.user.clinicId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/assignments/:id", authMiddleware, permit('admin', 'doctor', 'receptionist'), validate(updateAssignmentSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const assignmentId = parseInt(id, 10);
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment ID" });
    }
    const { status, notes } = req.body;
    const nextStatus = status || 'assigned';
    
    // Ensure clinicId and userId are handled safely
    const clinicId = req.user?.clinicId ?? null;
    const userId = req.user?.id ?? null;

    let query = `
      UPDATE assignments SET
        status = $1::text,
        notes = $2,
        completed_at = CASE WHEN $1::text = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = $3 AND clinic_id IS NOT DISTINCT FROM $4
    `;
    const params = [nextStatus, notes ?? null, assignmentId, clinicId];

    if (req.user.role === 'doctor') {
      query += ' AND doctor_id = $5';
      params.push(userId);
    }

    query += ' RETURNING *';

    let result;
    try {
      result = await pool.query(query, params);
    } catch (err) {
      const message = err?.message || '';
      // Fallback for older schemas missing clinic_id or completed_at
      if (message.includes('column "clinic_id" does not exist') || message.includes('column "completed_at" does not exist')) {
        let fallbackQuery = `
          UPDATE assignments SET
            status = $1,
            notes = $2
          WHERE id = $3
        `;
        const fallbackParams = [nextStatus, notes ?? null, assignmentId];
        if (req.user.role === 'doctor') {
          fallbackQuery += ' AND doctor_id = $4';
          fallbackParams.push(userId);
        }
        fallbackQuery += ' RETURNING *';
        result = await pool.query(fallbackQuery, fallbackParams);
      } else {
        throw err;
      }
    }
    if (result.rows.length === 0) return res.status(404).json({ error: "Assignment not found" });
    await logAudit(userId, 'UPDATE', 'assignments', assignmentId, { new_data: result.rows[0] }, clinicId);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/assignments/:id error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Reassign or unassign (admin/receptionist)
app.put("/api/assignments/:id/reassign", authMiddleware, permit('admin', 'receptionist'), async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId } = req.body;
    if (!doctorId) return res.status(400).json({ error: "doctorId is required" });
    const doctorOk = await ensureDoctorInClinic(doctorId, req.user.clinicId);
    if (!doctorOk) return res.status(404).json({ error: "Doctor not found" });
    const result = await pool.query(
      `UPDATE assignments SET doctor_id = $1, status = 'assigned', completed_at = NULL
       WHERE id = $2 AND clinic_id IS NOT DISTINCT FROM $3 RETURNING *`,
      [doctorId, id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Assignment not found" });
    await logAudit(req.user.id, 'UPDATE', 'assignments', id, { doctor_id: doctorId }, req.user.clinicId);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

app.delete("/api/assignments/:id", authMiddleware, permit('admin', 'receptionist'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM assignments WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 RETURNING *",
      [id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Assignment not found" });
    await logAudit(req.user.id, 'DELETE', 'assignments', id, { note: 'Assignment removed' }, req.user.clinicId);
    res.json({ message: "Assignment removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Lab Results
app.get("/api/lab-results", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, p.full_name as patient_name
      FROM lab_results l
      LEFT JOIN patients p ON l.patient_id = p.id
      WHERE l.clinic_id IS NOT DISTINCT FROM $1
      ORDER BY l.ordered_at DESC
    `, [req.user.clinicId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/patients/:patientId/lab-results", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const result = await pool.query(
      `SELECT * FROM lab_results WHERE patient_id = $1 AND clinic_id IS NOT DISTINCT FROM $2 ORDER BY ordered_at DESC`,
      [patientId, req.user.clinicId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/lab-results", authMiddleware, permit('doctor', 'admin'), validate(labSchema), async (req, res) => {
  try {
    const { patientId, testType, status, result } = req.body;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const dbRes = await pool.query(
      `INSERT INTO lab_results (patient_id, test_type, status, result, clinic_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patientId, testType, status || 'Ordered', result || null, req.user.clinicId]
    );
    await logAudit(req.user.id, 'CREATE', 'lab_results', dbRes.rows[0].id, { new_data: dbRes.rows[0] }, req.user.clinicId);
    res.status(201).json(dbRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/lab-results/:id", authMiddleware, permit('doctor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, result } = req.body;
    const dbRes = await pool.query(
      `UPDATE lab_results SET status = $1, result = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND clinic_id IS NOT DISTINCT FROM $4 RETURNING *`,
      [status || 'Ordered', result || null, id, req.user.clinicId]
    );
    if (dbRes.rows.length === 0) return res.status(404).json({ error: "Lab result not found" });
    await logAudit(req.user.id, 'UPDATE', 'lab_results', id, { new_data: dbRes.rows[0] }, req.user.clinicId);
    res.json(dbRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Medications
app.get("/api/patients/:patientId/medications", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const result = await pool.query(
      "SELECT * FROM medications WHERE patient_id = $1 AND clinic_id IS NOT DISTINCT FROM $2 ORDER BY created_at DESC",
      [patientId, req.user.clinicId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/patients/:patientId/medications", authMiddleware, permit('doctor', 'admin'), validate(medicationSchema), async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const {
      name, dosage, frequency, startDate, endDate, status, notes, prescribedBy
    } = req.body;
    const result = await pool.query(
      `INSERT INTO medications
        (patient_id, name, dosage, frequency, start_date, end_date, status, notes, prescribed_by, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        patientId,
        name,
        dosage || null,
        frequency || null,
        startDate === '' ? null : startDate,
        endDate === '' ? null : endDate,
        status || 'Active',
        notes || null,
        prescribedBy || null,
        req.user.clinicId
      ]
    );
    await logAudit(req.user.id, 'CREATE', 'medications', result.rows[0].id, { new_data: result.rows[0] }, req.user.clinicId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/medications/:id", authMiddleware, permit('doctor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM medications WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 RETURNING *",
      [id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Medication not found" });
    await logAudit(req.user.id, 'DELETE', 'medications', id, { note: 'Medication deleted' }, req.user.clinicId);
    res.json({ message: "Medication deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Allergies
app.get("/api/patients/:patientId/allergies", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const result = await pool.query(
      "SELECT * FROM allergies WHERE patient_id = $1 AND clinic_id IS NOT DISTINCT FROM $2 ORDER BY recorded_at DESC",
      [patientId, req.user.clinicId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/patients/:patientId/allergies", authMiddleware, permit('doctor', 'admin'), validate(allergySchema), async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const { allergen, reaction, severity, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO allergies (patient_id, allergen, reaction, severity, notes, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patientId, allergen, reaction || null, severity || null, notes || null, req.user.clinicId]
    );
    await logAudit(req.user.id, 'CREATE', 'allergies', result.rows[0].id, { new_data: result.rows[0] }, req.user.clinicId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/allergies/:id", authMiddleware, permit('doctor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM allergies WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 RETURNING *",
      [id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Allergy not found" });
    await logAudit(req.user.id, 'DELETE', 'allergies', id, { note: 'Allergy deleted' }, req.user.clinicId);
    res.json({ message: "Allergy deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Immunizations
app.get("/api/patients/:patientId/immunizations", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const result = await pool.query(
      "SELECT * FROM immunizations WHERE patient_id = $1 AND clinic_id IS NOT DISTINCT FROM $2 ORDER BY date DESC",
      [patientId, req.user.clinicId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/patients/:patientId/immunizations", authMiddleware, permit('doctor', 'admin'), validate(immunizationSchema), async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const { vaccine, date, dose, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO immunizations (patient_id, vaccine, date, dose, notes, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patientId, vaccine, date, dose || null, notes || null, req.user.clinicId]
    );
    await logAudit(req.user.id, 'CREATE', 'immunizations', result.rows[0].id, { new_data: result.rows[0] }, req.user.clinicId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/immunizations/:id", authMiddleware, permit('doctor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM immunizations WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 RETURNING *",
      [id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Immunization not found" });
    await logAudit(req.user.id, 'DELETE', 'immunizations', id, { note: 'Immunization deleted' }, req.user.clinicId);
    res.json({ message: "Immunization deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Problem List
app.get("/api/patients/:patientId/problems", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const result = await pool.query(
      "SELECT * FROM problem_list WHERE patient_id = $1 AND clinic_id IS NOT DISTINCT FROM $2 ORDER BY created_at DESC",
      [patientId, req.user.clinicId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/patients/:patientId/problems", authMiddleware, permit('doctor', 'admin'), validate(problemSchema), async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const { problem, status, onsetDate, resolvedDate, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO problem_list (patient_id, problem, status, onset_date, resolved_date, notes, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        patientId,
        problem,
        status || 'Active',
        onsetDate === '' ? null : onsetDate,
        resolvedDate === '' ? null : resolvedDate,
        notes || null,
        req.user.clinicId
      ]
    );
    await logAudit(req.user.id, 'CREATE', 'problem_list', result.rows[0].id, { new_data: result.rows[0] }, req.user.clinicId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/problems/:id", authMiddleware, permit('doctor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM problem_list WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2 RETURNING *",
      [id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Problem not found" });
    await logAudit(req.user.id, 'DELETE', 'problem_list', id, { note: 'Problem deleted' }, req.user.clinicId);
    res.json({ message: "Problem deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Emergencies
app.post("/api/emergencies", authMiddleware, permit('receptionist', 'admin', 'doctor'), validate(emergencySchema), async (req, res) => {
  try {
    const { patientId, description, priority } = req.body;
    if (patientId) {
      const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
      if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    }
    const result = await pool.query(
      `INSERT INTO emergencies (patient_id, description, created_by, priority, clinic_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patientId || null, description, req.user.id, priority || 'Normal', req.user.clinicId]
    );
    await logAudit(req.user.id, 'CREATE', 'emergencies', result.rows[0].id, { new_data: result.rows[0] }, req.user.clinicId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/emergencies", authMiddleware, permit('receptionist', 'admin', 'doctor'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await pool.query(
      `SELECT e.*, p.full_name as patient_name
       FROM emergencies e
       LEFT JOIN patients p ON e.patient_id = p.id
       WHERE e.clinic_id IS NOT DISTINCT FROM $1
       ORDER BY e.created_at DESC
       LIMIT $2`,
      [req.user.clinicId, limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Triage / queue
app.post("/api/patients/:patientId/triage", authMiddleware, permit('receptionist', 'admin', 'doctor'), validate(triageSchema), async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    const {
      weightKg, heightCm, bloodPressure, temperatureC, pulse, complaint, notes, status
    } = req.body;
    const result = await pool.query(
      `INSERT INTO triage
        (patient_id, weight_kg, height_cm, blood_pressure, temperature_c, pulse, complaint, notes, status, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        patientId,
        weightKg ?? null,
        heightCm ?? null,
        bloodPressure || null,
        temperatureC ?? null,
        pulse ?? null,
        complaint || null,
        notes || null,
        status || 'waiting',
        req.user.clinicId
      ]
    );
    await logAudit(req.user.id, 'CREATE', 'triage', result.rows[0].id, { new_data: result.rows[0] }, req.user.clinicId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

app.get("/api/triage", authMiddleware, permit('receptionist', 'admin', 'doctor'), async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    let query = `
      SELECT t.*, p.full_name as patient_name
      FROM triage t
      JOIN patients p ON t.patient_id = p.id
      WHERE t.clinic_id IS NOT DISTINCT FROM $1
    `;
    const params = [req.user.clinicId];
    if (status) {
      query += " AND t.status = $2";
      params.push(status);
    }
    query += " ORDER BY t.created_at DESC LIMIT $" + (params.length + 1);
    params.push(limit);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

app.put("/api/triage/:id/status", authMiddleware, permit('receptionist', 'admin', 'doctor'), validate(triageStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE triage SET status = $1 WHERE id = $2 AND clinic_id IS NOT DISTINCT FROM $3 RETURNING *`,
      [status, id, req.user.clinicId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Triage entry not found" });
    await logAudit(req.user.id, 'UPDATE', 'triage', id, { status }, req.user.clinicId);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

app.get("/api/patients/:patientId/triage/latest", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
    if (!canAccess) return res.status(404).json({ error: "Patient not found" });

    const result = await pool.query(
      `SELECT * FROM triage WHERE patient_id = $1 AND clinic_id IS NOT DISTINCT FROM $2
       ORDER BY created_at DESC LIMIT 1`,
      [patientId, req.user.clinicId]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Reports
app.get("/api/reports/summary", authMiddleware, permit('admin', 'receptionist', 'doctor'), async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const [
      patientsRes,
      activePatientsRes,
      doctorsRes,
      recordsRes,
      labsRes,
      medsRes,
      allergiesRes,
      immunizationsRes,
      problemsRes
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM patients WHERE clinic_id IS NOT DISTINCT FROM $1", [clinicId]),
      pool.query("SELECT COUNT(*) FROM patients WHERE clinic_id IS NOT DISTINCT FROM $1 AND is_active = true", [clinicId]),
      pool.query("SELECT COUNT(*) FROM users WHERE clinic_id IS NOT DISTINCT FROM $1 AND role = 'doctor' AND is_active = true", [clinicId]),
      pool.query("SELECT COUNT(*) FROM medical_records WHERE clinic_id IS NOT DISTINCT FROM $1", [clinicId]),
      pool.query("SELECT COUNT(*) FROM lab_results WHERE clinic_id IS NOT DISTINCT FROM $1", [clinicId]),
      pool.query("SELECT COUNT(*) FROM medications WHERE clinic_id IS NOT DISTINCT FROM $1", [clinicId]),
      pool.query("SELECT COUNT(*) FROM allergies WHERE clinic_id IS NOT DISTINCT FROM $1", [clinicId]),
      pool.query("SELECT COUNT(*) FROM immunizations WHERE clinic_id IS NOT DISTINCT FROM $1", [clinicId]),
      pool.query("SELECT COUNT(*) FROM problem_list WHERE clinic_id IS NOT DISTINCT FROM $1", [clinicId]),
    ]);

    res.json({
      patients: parseInt(patientsRes.rows[0].count),
      activePatients: parseInt(activePatientsRes.rows[0].count),
      activeDoctors: parseInt(doctorsRes.rows[0].count),
      records: parseInt(recordsRes.rows[0].count),
      labResults: parseInt(labsRes.rows[0].count),
      medications: parseInt(medsRes.rows[0].count),
      allergies: parseInt(allergiesRes.rows[0].count),
      immunizations: parseInt(immunizationsRes.rows[0].count),
      problems: parseInt(problemsRes.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// File Upload Routes
app.post("/api/upload", authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { patientId, uploadedBy } = req.body;
    if (patientId) {
      const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
      if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    }
    const relPath = `uploads/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO files (patient_id, filename, original_name, mimetype, size, path, uploaded_by, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [patientId || null, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, relPath, uploadedBy || 'system', req.user.clinicId]
    );

    res.status(201).json({ message: "File uploaded", file: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/upload/multiple", authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    const { patientId, uploadedBy } = req.body;
    if (patientId) {
      const canAccess = await ensurePatientInClinic(patientId, req.user.clinicId);
      if (!canAccess) return res.status(404).json({ error: "Patient not found" });
    }
    const uploadedFiles = [];

    for (const file of req.files) {
      const relPath = `uploads/${file.filename}`;
      const result = await pool.query(
        `INSERT INTO files (patient_id, filename, original_name, mimetype, size, path, uploaded_by, clinic_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
         [patientId || null, file.filename, file.originalname, file.mimetype, file.size, relPath, uploadedBy || 'system', req.user.clinicId]
      );
      uploadedFiles.push(result.rows[0]);
    }
    res.status(201).json({ message: `${uploadedFiles.length} files uploaded`, files: uploadedFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/patients/:patientId/files", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(`SELECT * FROM files WHERE patient_id = $1 AND clinic_id IS NOT DISTINCT FROM $2 ORDER BY created_at DESC`, [patientId, req.user.clinicId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/files", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, p.full_name as patient_name
      FROM files f LEFT JOIN patients p ON f.patient_id = p.id
      WHERE f.clinic_id IS NOT DISTINCT FROM $1
      ORDER BY f.created_at DESC`, [req.user.clinicId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/files/:fileId/download", authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileResult = await pool.query(
      `SELECT * FROM files WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2`,
      [fileId, req.user.clinicId]
    );
    if (fileResult.rows.length === 0) return res.status(404).json({ error: "File not found" });

    const file = fileResult.rows[0];
    const fullPath = path.join(__dirname, file.path);
    const downloadPath = path.isAbsolute(file.path) ? file.path : fullPath;

    if (!fs.existsSync(downloadPath)) return res.status(404).json({ error: "File not found" });

    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.original_name || file.filename}"`);

    const stream = fs.createReadStream(downloadPath);
    stream.on('error', (err) => {
      console.error(err);
      res.status(500).end();
    });
    stream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/files/:fileId", authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileResult = await pool.query(`SELECT * FROM files WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2`, [fileId, req.user.clinicId]);
    if (fileResult.rows.length === 0) return res.status(404).json({ error: "File not found" });

    const file = fileResult.rows[0];
    const fullPath = path.join(__dirname, file.path);
    const delPath = path.isAbsolute(file.path) ? file.path : fullPath;

    if (fs.existsSync(delPath)) fs.unlinkSync(delPath);

    await pool.query(`DELETE FROM files WHERE id = $1 AND clinic_id IS NOT DISTINCT FROM $2`, [fileId, req.user.clinicId]);
    await logAudit(req.user.id, 'DELETE', 'files', fileId, { note: 'File deleted' }, req.user.clinicId);
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

createTables()
  .then(async () => {
    await seedAdminIfNeeded();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database tables:", err);
    process.exit(1);
  });
