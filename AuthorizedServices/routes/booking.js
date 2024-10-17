import express from "express";
import {  getBooking, getParticularBooking, updateBooking } from "../controllers/booking.js";
import { authenticateToken } from "../middleware/middleware.js";
import { createBooking } from "../sockets/socketHandler.js";

const router = express.Router();

router.post("/",authenticateToken,createBooking)
router.get("/get-all",authenticateToken,getBooking)
router.get("/get/:id", authenticateToken,getParticularBooking)
router.put("/update/:id",authenticateToken,updateBooking)

export default router;
