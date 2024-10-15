import express from "express";
import {  getBooking, getParticularBooking, updateBooking } from "../controllers/booking.js";
import { authenticateToken } from "../middleware/middleware.js";

const router = express.Router();

// router.post("/create",createBooking)
router.get("/get",authenticateToken,getBooking)
router.get("/get?id", authenticateToken,getParticularBooking)
router.put("/update/:id",authenticateToken,updateBooking)

export default router;
