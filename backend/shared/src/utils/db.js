const mysql = require("mysql2/promise");
const path = require("path");
// Auto-load root .env if not already loaded by service
require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });

/**
 * Creates an isolated MySQL connection pool for a specific microservice database.
 * Uses prepared statements by default to prevent SQL injection.
 */
const createDbPool = (databaseName) => {
  // Use 127.0.0.1 instead of localhost to avoid Node 18+ IPv6 (::1) AggregateError [ECONNREFUSED]
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "homehub_user";
  const password = process.env.DB_PASSWORD || "homehub_secret";

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database: databaseName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
  });

  return pool;
};

module.exports = {
  createDbPool,
};
