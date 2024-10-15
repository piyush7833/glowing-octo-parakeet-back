import express from "express";
import { authenticateToken, isAdmin } from "../middleware/middleware.js";
import { getDriverAnalytics, getVehicleAnalytics } from "../controllers/admin.js";

const router = express.Router();

// router.post("/create",createBooking)
router.get("/get-vehicle/:id",authenticateToken,isAdmin,getVehicleAnalytics)
router.get("/get-driver/:id", authenticateToken,isAdmin,getDriverAnalytics)

export default router;
