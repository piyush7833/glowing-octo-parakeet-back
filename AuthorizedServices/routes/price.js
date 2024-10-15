import express from "express";
import { getPrice } from "../controllers/price.js";

const router = express.Router();

router.get("/get", getPrice)
export default router;
