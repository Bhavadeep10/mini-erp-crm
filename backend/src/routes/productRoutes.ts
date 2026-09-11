import { Router } from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  addStockMovement
} from "../controllers/productController";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN", "WAREHOUSE"),
  addProduct
);

router.get(
  "/",
  authMiddleware,
  getProducts
);

router.get(
  "/:id",
  authMiddleware,
  getProductById
);

router.put(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN", "WAREHOUSE"),
  updateProduct
);

router.post(
  "/:id/stock",
  authMiddleware,
  allowRoles("ADMIN", "WAREHOUSE"),
  addStockMovement
);

export default router;