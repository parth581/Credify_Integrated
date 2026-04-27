import { fetchPlaces } from "../services/placesServices.js";

export const getPlaces = async (req, res) => {
  try {
    const { lat, lon, radius = 1000, category } = req.body;

    if (!lat || !lon || !category) {
      return res.status(400).json({
        error: "lat, lon, and category are required parameters",
      });
    }

    const places = await fetchPlaces(lat, lon, radius, category);
    console.log(places);
    res.json({ results: places });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
