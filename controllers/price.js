import { pricePerKm, surgcharge } from "../config/config.js";
import axios from "axios";

export const getPrice = async (req, res) => {
  try {
    const { src, destn, vehicleType, distance } = req.body;
    // console.log(src, destn, vehicleType);
    // console.log(src.lat, src.lng, destn.lat, destn.lng, vehicleType);
    if (!src || !destn || !vehicleType || !distance) {
      return res
        .status(400)
        .json({ error: "Source, destination, and vehicle type are required" });
    }
    let price = pricePerKm[vehicleType] * distance;
    if (distance > 100) {
      price += price * surgcharge["dist>100"];
    }
    if (new Date().getHours() >= 20 || new Date().getHours() <= 6) {
      price += price * surgcharge["night"];
    }
    // const isRainingSrc = await isRaining(src.lat, src.lng);
    // if (isRainingSrc) {
    //   price += price * surgcharge["rain"];
    // }
    
    // const trafficData = await getTrafficData(src, destn);
    // console.log(trafficData,"trafficData")
    // const evaluatedTraffic = evaluateTrafficCondition(trafficData);
    // if (evaluatedTraffic === 'High Traffic') {
    //     price += price * surgcharge["traffic-high"];
    // }
    // if (evaluatedTraffic === 'Moderate Traffic') {
    //     price += price * surgcharge["traffic-moderate"];
    // }
    return res
      .status(200)
      .json({ data: { price }, message: "Price fetched successfully" });
  } catch (error) {
    // console.log(error,"error")
    return res
      .status(500)
      .json({ message: "An error occurred while fetching price." });
  }
};

async function isRaining(lat, lon) {
  const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  console.log(WEATHER_API_KEY);
  console.log(process.env.WEATHER_API_KEY);
  const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
  const url = `${WEATHER_BASE_URL}?lat=${lat}&lon=${lon}&appid=c059f784c40df175b4d8623e9553966a&units=metric`; // Metric units for temperature

  try {
    const response = await axios.get(url);
    const weatherData = response.data;

    // Check the weather conditions
    const weatherConditions = weatherData.weather; // Array of weather conditions
    const isRaining = weatherConditions.some(
      (condition) => condition.main.toLowerCase() === "rain"
    );

    return isRaining; // Returns true if it is raining, otherwise false
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error; // Propagate the error
  }
}
