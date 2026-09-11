import { Router } from "express";
import {
  createChallan,
  getChallans,
  getChallanById,
  confirmChallan
} from "../controllers/challanController";
import { authMiddleware } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN", "SALES"),
  createChallan
);

router.get(
  "/",
  authMiddleware,
  getChallans
);

router.get(
  "/:id",
  authMiddleware,
  getChallanById
);

router.put(
  "/:id/confirm",
  authMiddleware,
  allowRoles("ADMIN", "SALES"),
  confirmChallan
);

export default router;