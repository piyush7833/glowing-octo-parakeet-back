import axios from "axios";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OPENROUTESERVICE_URL =
  "https://api.openrouteservice.org/v2/directions/driving-car";
const ORS_API_KEY = "5b3ce3597851110001cf6248ef552cf02b0f487b9f8d6140d1c9b886"; // Your OpenRouteService API key

export const getLocations = async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: query,
        format: "json",
        addressdetails: 1,
        limit: 5,
      },
      timeout: 20000, // Set timeout to 10 seconds
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    res.status(500).json({ error: "Failed to fetch location suggestions" });
  }
};

export const getRoute = async (req, res) => {
  var { src, destn } = req.body;
  console.log(src, destn);
  src = {
    lng: Number(src.lng),
    lat: Number(src.lat),
  };
  destn = {
    lng: Number(destn.lng),
    lat: Number(destn.lat),
  };

  // Validate coordinates
  if (
    !src ||
    !destn ||
    typeof src.lng !== "number" ||
    typeof src.lat !== "number" ||
    typeof destn.lng !== "number" ||
    typeof destn.lat !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "Valid source and destination coordinates are required" });
  }

  // Check for valid latitude and longitude ranges
  if (
    src.lat < -90 ||
    src.lat > 90 ||
    src.lng < -180 ||
    src.lng > 180 ||
    destn.lat < -90 ||
    destn.lat > 90 ||
    destn.lng < -180 ||
    destn.lng > 180
  ) {
    return res
      .status(400)
      .json({
        error:
          "Source and destination coordinates must be valid latitude and longitude values.",
      });
  }

  console.log("Source coordinates:", src);
  console.log("Destination coordinates:", destn);

  try {
    const response = await axios.post(
      OPENROUTESERVICE_URL,
      {
        coordinates: [
          [src.lng, src.lat],
          [destn.lng, destn.lat],
        ],
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // Log the full response
    console.log('Response from OpenRouteService:', JSON.stringify(response.data, null, 2));

    const route = response.data.routes[0].geometry;
    const distance = response.data.routes[0].summary.distance; // Convert to km
    const time = response.data.routes[0].summary.duration / 60; // Convert to minutes

    res.json({
      route,
      distance: distance.toFixed(2),
      time: time.toFixed(2),
    });
  } catch (error) {
    console.error(
      "Error calculating route:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to calculate route" });
  }
};

export const realTimeLocation = async () => {
  const Consumer = kafka.Consumer;
  const client = new kafka.KafkaClient({ kafkaHost: "kafka-2a01720c-ps672248-0c67.h.aivencloud.com" });
  const consumer = new Consumer(
    client,
    [{ topic: "car-tracking", partition: 0 }],
    { autoCommit: true }
  );

  // Send messages from Kafka to clients
  consumer.on("message", (message) => {
    const locationData = JSON.parse(message.value);
    io.emit("location_update", locationData);
  });

  consumer.on("error", (err) => {
    console.error("Error:", err);
  });
};
