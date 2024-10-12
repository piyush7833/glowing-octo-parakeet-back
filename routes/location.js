import express from "express"
import { getLocations, getRoute } from "../controllers/location.js";
const router=express.Router()


router.get("/get",getLocations )
router.post("/get-route",getRoute)

export default router;