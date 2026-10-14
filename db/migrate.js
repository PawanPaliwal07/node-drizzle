require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { migrate } = require("drizzle-orm/mysql2/migrator");
const { db, pool } = require("./index");

async function runMigration() {
  const migrationsFolder = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsFolder)) {
    pool.end();
    return;
  }
  try {
    console.log("⏳ Running migrations from ./db/migrations ...");
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("✅ Migrations applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    pool.end();
  }
}

runMigration();