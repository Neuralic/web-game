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

// Create PostgreSQL connection pool with optimized settings for Supabase
const pool = new Pool({
  host: url.hostname,
  port: parseInt(url.port),
  database: url.pathname.slice(1), // Remove leading slash
  user: url.username,
  password: url.password,
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increased from 2000 to 10000ms (10 seconds)
  statement_timeout: 30000, // Query timeout: 30 seconds
  query_timeout: 30000, // Query timeout: 30 seconds
  ssl: {
    rejectUnauthorized: false, // Required for Supabase connections
  },
});

// Test connection on startup
pool.connect((err, _client, release) => {
  if (err) {
    console.error("❌ Error connecting to database:", err.stack);
  } else {
    console.log("✅ Database connected successfully");
    release();
  }
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("❌ Unexpected database pool error:", err);
});

export default pool;
