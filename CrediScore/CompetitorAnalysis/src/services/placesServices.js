import axios from "axios";
import { buildOverpassQuery } from "../utils/overpassQuery.js";

export const fetchPlaces = async (lat, lon, radius, category) => {
  try {
    const query = buildOverpassQuery(lat, lon, radius, category);

    const endpoints = [
      process.env.OVERPASS_URL,
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.nchc.org.tw/api/interpreter",
    ].filter(Boolean);

    let lastError;
    for (const url of endpoints) {
      try {
        const response = await axios.post(url, query, {
          headers: {
            "Content-Type": "text/plain",
            // Some public Overpass instances are stricter without a UA.
            "User-Agent": "CrediScore/1.0 (local dev)",
          },
          timeout: 30000,
          // Overpass may respond non-200 while still returning a useful body.
          validateStatus: () => true,
        });

        if (response.status >= 200 && response.status < 300) {
          return response.data.elements.map((place) => ({
            id: place.id,
            name: place.tags?.name || "Unnamed",
            type: place.tags?.amenity || place.tags?.shop || "unknown",
            lat: place.lat,
            lon: place.lon,
            address: {
              street: place.tags?.["addr:street"] || null,
              city: place.tags?.["addr:city"] || null,
              postcode: place.tags?.["addr:postcode"] || null,
            },
          }));
        }

        lastError = new Error(
          `Overpass error from ${url}: HTTP ${response.status} ${JSON.stringify(response.data).slice(0, 500)}`,
        );
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError ?? new Error("Unknown Overpass error");
  } catch (error) {
    throw new Error(
      `Failed to fetch places from Overpass API. ${error?.message ?? error}`,
    );
  }
};
