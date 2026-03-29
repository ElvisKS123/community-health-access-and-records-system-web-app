const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      // Railway PostgreSQL uses SSL but doesn't strictly always require rejectUnauthorized: false unless externally connecting, though it's safer for cloud deployments
      ssl: process.env.DATABASE_URL.includes('railway.app') || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || "5432"),
    };

const pool = new Pool(poolConfig);

// Test connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully:", res.rows);
  }
});

module.exports = pool;