import express from "express";
import morgan from "morgan";
import cors from "cors";
import { pricePerKm, surgcharge } from "./config.js";

// Rest object
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
 
// Routes
app.get("/api/price/get", (req, res) => {
  try {
    let { traffic, distance, isRaining } = req.query;

    let miniPrice = pricePerKm["mini"] * (distance / 1000);
    let truckPrice = pricePerKm["truck"] * (distance / 1000);
    let bigTruckPrice = pricePerKm["big-truck"] * (distance / 1000);

    if (!distance || distance==0) {
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
    if(traffic==undefined || !traffic){
      traffic = "traffic-low";
    }
    totalSurcharge += surgcharge[traffic];
    if (isRaining) {
      totalSurcharge += surgcharge["rain"];
    }

    miniPrice += miniPrice * totalSurcharge;
    truckPrice += truckPrice * totalSurcharge;
    bigTruckPrice += bigTruckPrice * totalSurcharge;
    // console.log("object", miniPrice, truckPrice, bigTruckPrice);
    return res.status(200).json({
      data: {
        price: {
          "mini truck": miniPrice.toFixed(2),
          truck: truckPrice.toFixed(2),
          "big truck": bigTruckPrice.toFixed(2),
        },
      },
      message: "Price fetched successfully",
    });
  } catch (error) {
    console.log(error, "error");
    return res
      .status(500)
      .json({ message: "An error occurred while fetching price." });
  }
});

// PORT
const PORT = process.env.PORT || 8080;

// Run listen
app.listen(PORT, () => {
  console.log(
    `Server Running on port ${PORT}`
  );
});
