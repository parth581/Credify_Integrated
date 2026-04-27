import express from "express";
import  {getPlaces}  from "../controllers/placesControllers.js";

const router = express.Router();

// GET /api/places?lat=...&lon=...&radius=...&category=...
router.post("/places", getPlaces);

export default router;
