import { pricePerKm, surgcharge } from "../config/config.js";

export const getPrice = async (req, res) => {
  try {
    let { traffic, distance,isRaining } = req.query;

    let miniPrice = pricePerKm["mini"]*(distance/1000);
    let truckPrice = pricePerKm["truck"]*(distance/1000);
    let bigTruckPrice = pricePerKm["big-truck"]*(distance/1000);

    if (!distance) {
      return res
        .status(400)
        .json({ error: "Traffic and distance are required" });
    }
    let totalSurcharge = 0;

    if (distance / 1000 > 100) {
      totalSurcharge += surgcharge["dist>100"];
    }
    if (distance / 1000 > 200) {
      console.log(distance, "distance");
      totalSurcharge += surgcharge["dist>200"];
    }
    if (new Date().getHours() >= 20 || new Date().getHours() <= 6) {
      totalSurcharge += surgcharge["night"];
    }
    totalSurcharge += surgcharge[traffic?traffic:"traffic-low"];
    if (isRaining) {
      totalSurcharge += surgcharge["rain"];
    }

    miniPrice += miniPrice * totalSurcharge;
    truckPrice += truckPrice * totalSurcharge;
    bigTruckPrice += bigTruckPrice * totalSurcharge;
    console.log("object",miniPrice,truckPrice,bigTruckPrice)
    return res
      .status(200)
      .json({ data: { price:{
        "mini truck":miniPrice.toFixed(2),
        "truck":truckPrice.toFixed(2),
        "big truck":bigTruckPrice.toFixed(2)
      } }, message: "Price fetched successfully" });
  } catch (error) {
    console.log(error,"error")
    return res
      .status(500)
      .json({ message: "An error occurred while fetching price." });
  }
};


