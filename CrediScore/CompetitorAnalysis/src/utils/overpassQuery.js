// Supported categories mapped to OSM tags
const categoryMappings = {
  medical: '["amenity"="pharmacy"]',
  hospital: '["amenity"="hospital"]',
  doctor: '["amenity"="doctors"]',
  barber: '["shop"="hairdresser"]',
  salon: '["shop"="beauty"]',
  grocery: '["shop"="supermarket"]',
  bakery: '["shop"="bakery"]',
  restaurant: '["amenity"="restaurant"]',
  cafe: '["amenity"="cafe"]',
  atm: '["amenity"="atm"]',
  bank: '["amenity"="bank"]',
  school: '["amenity"="school"]',
  college: '["amenity"="college"]',
  fuel: '["amenity"="fuel"]',
  parking: '["amenity"="parking"]',
  bus_stop: '["highway"="bus_stop"]',
  hotel: '["tourism"="hotel"]',
};

export const buildOverpassQuery = (lat, lon, radius, category) => {
  const filter = categoryMappings[category];

  if (!filter) {
    throw new Error(`Unsupported category: ${category}`);
  }

  return `
    [out:json];
    (
      node${filter}(around:${radius},${lat},${lon});
      way${filter}(around:${radius},${lat},${lon});
      relation${filter}(around:${radius},${lat},${lon});
    );
    out center;
  `;
};
