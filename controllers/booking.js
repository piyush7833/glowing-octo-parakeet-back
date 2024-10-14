import { validationResult } from "express-validator";
import { getNearByDrivers } from "./driver.js";
import Booking from "../models/Booking.js";
import {  triggerStartNotificationForUser,stopNotification } from "../utils/services.js";


export const createBooking = async (req, res) => {
  try {
    const { src, destn, vehicleType, price, srcName, destnName, distance } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      return res.status(400).json({ message: firstError.msg });
    }

    const drivers = await getNearByDrivers(src, vehicleType);
    const selectedDrivers = drivers.slice(0, 10);

    if (selectedDrivers.length === 0) {
      return res.status(404).json({ message: "No drivers available nearby." });
    }

    // Create a new booking but do not send a success response yet
    const booking = new Booking({
      src:{
        type: "Point",
        coordinates: [src.lng, src.lat],
      },
      destn:{
        type: "Point",
        coordinates: [destn.lng, destn.lat],
      },
      distance,
      price,
      status: 'pending', // Set status to 'pending' initially
    });
    const newBooking = await booking.save();

    let bookingResolved = false;

    // Helper function to resolve the booking once a driver accepts
    const resolveBooking = async (driverId) => {
      if (bookingResolved) return;
      bookingResolved = true;

      // Update the booking with the allocated driver
      newBooking.driverId = driverId;
      newBooking.status = 'accepted';
      await newBooking.save();

      // Stop sending notifications to all other drivers
      selectedDrivers.forEach(driver => {
        if (driver._id !== driverId) {
          stopNotification(driver.userId);
        }
      });

      // Respond with success once a driver is allocated
      res.json({ message: "Booking created and driver allocated successfully", booking: newBooking });
    };

    // Send notifications to each selected driver
    selectedDrivers.forEach(driver => {
      const notification = {
        srcName,
        destnName,
        price,
        distance: driver.distance,
        bookingId: newBooking._id,
      };

      // Start notification for each driver
      const userId=driver._id
      triggerStartNotificationForUser(userId, notification, newBooking._id, resolveBooking);
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while creating the booking" });
  }
};

export const updateBookingStatusInDB = async (bookingId, driverId) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Update the booking status to accepted and assign the driver
    booking.status = 'accepted';
    booking.driverId = driverId;
    await booking.save();
    
    console.log(`Booking ${bookingId} updated successfully`);
    return booking;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
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
    const updates = Object.keys(req.body);
    const allowedUpdates = ['status', 'driverId', 'duration', 'distance', 'price','src','destn'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).send({ message: 'Invalid updates!' });
    }

    try {
        const {id} = req.params;
        const booking = await Booking.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        return res.json({data:{booking}, message: "Booking updated successfully" });
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
        return res.json({data:{booking}, message: "Particular booking fetched successfully" });
    } catch (error) {
        console.error(error);
        return res
        .status(500)
        .json({ message: "An error occurred while fetching particular booking" });
    }
    }
