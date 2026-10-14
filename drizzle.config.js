import "dotenv/config";

/** @type {import("drizzle-kit").Config} */
export default {
  schema: "./db/schema",
  out: "./db/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: "mysql://root@localhost:3306/autofit",
  },
};
