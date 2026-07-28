/**
 * Database Configuration
 *
 * Uses @neondatabase/serverless when DATABASE_URL is set (Neon cloud).
 * This driver communicates over HTTPS (port 443) instead of raw TCP port 5432,
 * which bypasses firewall restrictions common on college/corporate networks.
 *
 * Falls back to the standard `pg` Pool for local PostgreSQL setups.
 */

let pool;
let neonSql; // Used only with the Neon HTTP driver

/**
 * Strips unsupported query parameters (like channel_binding) from a Postgres connection URL.
 * The pg Node.js driver does not understand channel_binding and will hang/timeout.
 */
const sanitizeConnectionURL = (url) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('channel_binding');
    return parsed.toString();
  } catch {
    return url;
  }
};

/**
 * Connects to PostgreSQL and creates tables if they don't exist.
 */
const connectDB = async () => {
  if (process.env.DATABASE_URL) {
    // ── Neon Serverless (HTTPS, port 443) ─────────────────────────────────────
    try {
      const { neon, Pool: NeonPool } = require('@neondatabase/serverless');
      const cleanUrl = sanitizeConnectionURL(process.env.DATABASE_URL);

      // neon() gives a tagged-template SQL function for simple queries
      neonSql = neon(cleanUrl);

      // NeonPool gives a pg-compatible Pool for transaction/pool queries
      pool = new NeonPool({ connectionString: cleanUrl });

      // Test connection
      await neonSql`SELECT 1`;
      console.log('PostgreSQL (Neon Serverless / HTTPS) connected successfully.');
    } catch (err) {
      console.error('Neon Serverless connection error:', err.message);
      process.exit(1);
    }
  } else {
    // ── Local PostgreSQL (standard pg Pool, TCP port 5432) ────────────────────
    const { Pool } = require('pg');
    const config = {
      user:     process.env.PGUSER     || 'postgres',
      password: process.env.PGPASSWORD || '08September2005',
      host:     process.env.PGHOST     || 'localhost',
      port:     parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE || 'QL_APP',
    };

    try {
      pool = new Pool(config);
      await pool.query('SELECT 1');
      console.log('PostgreSQL (local) connected successfully.');
    } catch (error) {
      if (error.code === '3D000') {
        // Database does not exist — create it
        console.log(`Database "${config.database}" not found. Creating it...`);
        const tempPool = new Pool({ ...config, database: 'postgres' });
        try {
          await tempPool.query(`CREATE DATABASE ${config.database}`);
          await tempPool.end();
          pool = new Pool(config);
          await pool.query('SELECT 1');
          console.log(`Database "${config.database}" created and connected.`);
        } catch (createErr) {
          console.error('Failed to create database:', createErr.message);
          process.exit(1);
        }
      } else {
        console.error('PostgreSQL connection error:', error.message);
        process.exit(1);
      }
    }
  }

  // ── Create tables if they do not exist ──────────────────────────────────────
  try {
    await connectDB.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        roll_number VARCHAR(255) UNIQUE NOT NULL,
        department VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS staffs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        staff_id INTEGER NOT NULL REFERENCES staffs(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        response_message TEXT DEFAULT '',
        attachment_path VARCHAR(255) DEFAULT '',
        attachment_name VARCHAR(255) DEFAULT '',
        applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(50) DEFAULT 'usd',
        description VARCHAR(255) NOT NULL,
        stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PostgreSQL tables initialized/verified successfully.');
  } catch (err) {
    console.error('PostgreSQL schema initialization error:', err.message);
    process.exit(1);
  }
};

/**
 * Unified query interface.
 * When using Neon serverless, routes through the Pool (which supports parameterized queries).
 */
connectDB.query = (text, params) => {
  if (!pool) {
    throw new Error('Database not connected yet. Call connectDB() first.');
  }
  return pool.query(text, params);
};

connectDB.getPool = () => pool;

module.exports = connectDB;
