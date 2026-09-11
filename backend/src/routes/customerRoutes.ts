import { Router } from "express";
import {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  addFollowUp
} from "../controllers/customerController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, addCustomer);

router.get("/", authMiddleware, getCustomers);

router.get("/:id", authMiddleware, getCustomerById);

router.put("/:id", authMiddleware, updateCustomer);

router.post("/:id/followups", authMiddleware, addFollowUp);

export default router;