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

const PORT = Number(process.env.PORT) || 5000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/challans", challanRoutes);

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "Mini ERP CRM Backend is running"
  });
});

// ===============================
// DATABASE TEST
// ===============================

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

// ===============================
// PROFILE
// ===============================

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

// ===============================
// ADMIN TEST
// ===============================

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

// ===============================
// START SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});