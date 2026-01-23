import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get database URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Parse connection string manually to ensure password is a string
const url = new URL(connectionString);

// Create PostgreSQL connection pool optimized for serverless
const pool = new Pool({
  host: url.hostname,
  port: parseInt(url.port),
  database: url.pathname.slice(1), // Remove leading slash
  user: url.username,
  password: url.password,
  max: 1, // Serverless: only 1 connection per function instance
  idleTimeoutMillis: 10000, // Close idle clients quickly
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase connections
  },
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("❌ Database pool error:", err);
});

export default pool;
