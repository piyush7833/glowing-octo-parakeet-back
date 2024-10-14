import { validationResult } from "express-validator";
import Driver from "../models/Driver.js";

export const setCurrLocation= async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { coordinates } = req.body;

    try {
      const updatedDriver = await Driver.findByIdAndUpdate(
        id,
        {
          currentLocation: {
            type: "Point",
            coordinates: coordinates,
          },
        },
        { new: true, runValidators: true }
      );

      if (!updatedDriver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      return res.status(200).json({
        message: "Driver's coordinates updated successfully",
        driver: updatedDriver,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "An error occurred while updating the driver's coordinates.",
      });
    }
  }


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
