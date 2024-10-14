import express from "express"
import {setCurrLocation } from "../controllers/location.js";
const router=express.Router()


router.put("/set/:id",setCurrLocation)

export default router;