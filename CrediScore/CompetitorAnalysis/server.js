import express from "express";
import dotenv from "dotenv";
import placesRoutes from "./src/routes/placesRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use("/api", placesRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
