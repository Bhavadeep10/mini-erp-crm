import express from "express";
import cors from "cors";

import { pool } from "./config/database";

import authRoutes from "./routes/authRoutes";
import customerRoutes from "./routes/customerRoutes";
import productRoutes from "./routes/productRoutes";
import challanRoutes from "./routes/challanRoutes";

import { authMiddleware, AuthRequest } from "./middleware/authMiddleware";
import { allowRoles } from "./middleware/roleMiddleware";

const app = express();

const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/challans", challanRoutes);

// Home
app.get("/", (req, res) => {
  res.json({
    message: "Mini ERP CRM Backend is running"
  });
});

// Database Test
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "PostgreSQL connection successful",
      databaseTime: result.rows[0].now
    });
  } catch (error) {
    console.error("Database test failed:", error);

    res.status(500).json({
      message: "PostgreSQL connection failed"
    });
  }
});

// Profile
app.get(
  "/api/profile",
  authMiddleware,
  (req: AuthRequest, res) => {
    res.json({
      message: "You are logged in",
      user: req.user
    });
  }
);

// Admin Test
app.get(
  "/api/admin-test",
  authMiddleware,
  allowRoles("ADMIN"),
  (req: AuthRequest, res) => {
    res.json({
      message: "Admin access granted",
      user: req.user
    });
  }
);

// Start Server
app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});