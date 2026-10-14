require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const { verifyConnection, closePool } = require("./db");

const app = express();
const PORT = process.env.PORT || 3016;

// Import Routes
const authRoutes = require("./routes/authRoutes");
const staticRoutes = require("./routes/staticRoutes");
const contactUsRoutes = require("./routes/contactUsRoutes");

// CORS Configuration
app.use(
    cors({
        origin: true,
        credentials: true,
    }),
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    "/OnlineImages",
    express.static(path.join(__dirname, "uploads", "OnlineImages"), {
        etag: false,
        lastModified: false,
        setHeaders: (res) => {
            res.setHeader(
                "Cache-Control",
                "no-store, no-cache, must-revalidate, proxy-revalidate",
            );
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
        },
    }),
);
app.use("/assets", express.static(path.join(__dirname, "uploads", "assets")));

app.use("/api/auth", authRoutes);
app.use("/api/page", staticRoutes);
app.use("/api/contact", contactUsRoutes);

let server;
async function start() {
    try {
        await verifyConnection();
        server = app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("❌ Server failed to start because the database is unreachable.");
        closePool("startup failure");
        process.exit(1);
    }
}
start();

function shutdown(signal) {
    if (server) {
        server.close(() => {
            closePool(signal);
        });
    } else {
        closePool(signal);
    }
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
    console.error("❌ Unhandled promise rejection:", reason);
    shutdown("unhandledRejection");
});
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught exception:", err);
    shutdown("uncaughtException");
});