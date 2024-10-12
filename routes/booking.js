import express from "express";
import { createBooking, getBooking, getParticularBooking, updateBooking } from "../controllers/booking.js";

const router = express.Router();

router.post("/create",createBooking)
router.post("/get",getBooking)
router.post("/get?id",getParticularBooking)
router.post("/update/:id",updateBooking)

export default router;
