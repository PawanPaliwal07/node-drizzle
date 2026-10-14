require("dotenv").config();
const mysql = require("mysql2");
const { drizzle } = require("drizzle-orm/mysql2");
const schema = require("./schema");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "autofit",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

const promisePool = pool.promise();
const db = drizzle(promisePool, { schema, mode: "default" });

function rawQuery(sql, params = [], callback) {
  if (typeof callback === "function") {
    pool.query(sql, params, callback);
    return;
  }
  return promisePool.query(sql, params).then(([rows]) => rows);
}

function verifyConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("❌ Database connection failed:", err.message);
        return reject(err);
      }
      console.log("✅ Database connection established successfully");
      connection.release();
      resolve();
    });
  });
}
let isClosing = false;
function closePool(reason = "shutdown") {
  if (isClosing) return;
  isClosing = true;
  console.log(`⏳Closing database pool (${reason})...`);
  pool.end((err) => {
    if (err) {
      console.error("❌ Error while closing database pool:", err.message);
      process.exitCode = 1;
      return;
    }
    console.log("✅ Database pool closed successfully");
  });
}

module.exports = { pool, promisePool, db, rawQuery, schema, verifyConnection, closePool };