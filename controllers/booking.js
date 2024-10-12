import { validationResult } from "express-validator";
import { getNearByDrivers } from "./driver.js";
import Booking from "../models/Booking.js";

export const createBooking = async (req, res) => {
  try {
    const { src, destn, vehicleType, price } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      return res.status(400).json({ message: firstError.msg });
    }
    const drivers = await getNearByDrivers(src);
    const selectedDrivers = drivers.slice(0, 5);
    selectedDrivers.forEach(driver => {
      const notification = {
        src,
        destn,
        price,
        kmsAway: driver.kmsAway
      };
      // Assuming sendNotification is a function that sends a notification to the driver
      sendNotification(driver.id, notification);
    });
    return res.json({ message: "Booking created successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while creating booking" });
  }
};

export const getBooking = async (req, res) => {
    try {
        const bookings = await Booking.findMany({adminId: req.user.id});
        if(!bookings || bookings.length === 0){
            return res.status(404).json({message: "No bookings found"});
        }
        return res.json({data:{bookings}, message: "Booking fetched successfully" });
    } catch (error) {
        console.error(error);
        return res
        .status(500)
        .json({ message: "An error occurred while fetching booking" });
    }
}

export const updateBooking = async (req, res) => {
    const { id } = req.params;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['status', 'driverId', 'duration', 'distance', 'price','src','destn'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).send({ message: 'Invalid updates!' });
    }

    try {
        const {id} = req.params;
        const booking = await Booking.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        return res.json({ message: "Booking updated successfully" });
    } catch (error) {
        console.error(error);
        return res
        .status(500)
        .json({ message: "An error occurred while updating booking" });
    }
}

export const getParticularBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        return res.json({ message: "Particular booking fetched successfully" });
    } catch (error) {
        console.error(error);
        return res
        .status(500)
        .json({ message: "An error occurred while fetching particular booking" });
    }
    }
