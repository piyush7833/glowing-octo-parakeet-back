import express from "express";
import { authenticateToken, isAdmin } from "../middleware/middleware.js";
import { createDriver, deleteDriver, getAllDrivers, getParticularDriver, updateDriver } from "../controllers/driver.js";

const router = express.Router();

router.post("/create",authenticateToken,isAdmin, createDriver);
router.get("/get",authenticateToken,isAdmin, getAllDrivers);
router.get("/get/:id",authenticateToken, getParticularDriver);
router.put("/update/:id",authenticateToken,isAdmin, updateDriver);
router.delete("/delete/:id",authenticateToken,isAdmin, deleteDriver);

export default router;
