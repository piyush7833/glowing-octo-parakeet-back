import { validationResult } from 'express-validator';
import Vehicle from '../models/Vehicle.js'; // Adjust the import path based on your project structure
import Driver from '../models/Driver.js';
import mongoose from 'mongoose';
export const createVehicle= async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ message: firstError.msg });
  }

  const { type, numberPlate, model } =
    req.body;

  try {
    const newVehicle = new Vehicle({
      type,
      numberPlate,
      model,
      adminId: req.user.id,
    });

    await newVehicle.save();
    return res.status(201).json({data:{vehicle:newVehicle},message:"Vehicle added successfully"});
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while creating the vehicle." });
  }
}


// Read All Vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ adminId: req.user.id })
      .populate({
        path: "driverId",
        select: "licenseNumber",
        populate: {
          path: "userId",
          select: "name"
        }
      }).exec();
      console.log(vehicles)
    res.status(200).send({
      data: {
      vehicles: vehicles.map(vehicle => ({
        _id: vehicle._id,
        type: vehicle.type,
        numberPlate: vehicle.numberPlate,
        model: vehicle.model,
        driver: vehicle.driverId ? {
        licenseNumber: vehicle.driverId.licenseNumber,
        name: vehicle.driverId.userId ? vehicle.driverId.userId.name : null
        } : null
      }))
      },
      message: "Vehicles fetched successfully"
    });
  } catch (error) {
    res.status(500).send({ message: 'Error fetching vehicles', details: error.message });
  }
};

// Read Vehicle by ID
export const getVehicleById = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findById(id).populate({
      path: "driverId",
      select: "licenseNumber",
      populate: {
        path: "userId",
        select: "name"
      }
      });
    if (!vehicle) {
      return res.status(404).send({ message: 'Vehicle not found' });
    }
    res.status(200).send({data:{vehicle:{
      _id: vehicle._id,
      type: vehicle.type,
      numberPlate: vehicle.numberPlate,
      model: vehicle.model,
      driver: vehicle.driverId ? {
      licenseNumber: vehicle.driverId.licenseNumber,
      name: vehicle.driverId.userId ? vehicle.driverId.userId.name : null
      } : null
    }},message:"Vehicle fetched successfully"});
  } catch (error) {
    res.status(500).send({ message: 'Error fetching vehicle', details: error.message });
  }
};


export const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['type', 'numberPlate', 'model', 'driverId', 'imageUrl'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ message: 'Invalid updates!' });
  }

  try {
    // Check if the provided vehicle ID is valid
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({ message: 'Invalid vehicle ID' });
    }

    let updateData = { ...req.body };

    // Handle driverId value
    if (req.body.driverId === "Remove Driver") {
      updateData.driverId = null;
      await Driver.findOneAndUpdate({ vehicleId: id }, { vehicleId: null });
    } else if (req.body.driverId && !mongoose.isValidObjectId(req.body.driverId)) {
      return res.status(400).send({ message: 'Invalid driver ID' });
    }

    // Update driver information if a valid driverId is provided
    if (updateData.driverId) {
      await Driver.findOneAndUpdate({ _id: updateData.driverId }, { vehicleId: id });
    }

    // Update vehicle information
    const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate({
      path: "driverId",
      select: "licenseNumber",
      populate: {
        path: "userId",
        select: "name"
      }
    }).exec();

    if (!vehicle) {
      return res.status(404).send({ message: 'Vehicle not found' });
    }

    res.status(200).send({ data: { vehicle:{
      _id: vehicle._id,
      type: vehicle.type,
      numberPlate: vehicle.numberPlate,
      model: vehicle.model,
      driver: vehicle.driverId ? {
      licenseNumber: vehicle.driverId.licenseNumber,
      name: vehicle.driverId.userId ? vehicle.driverId.userId.name : null
      } : null
    } }, message: 'Vehicle updated successfully' });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: 'Error updating vehicle', details: error.message });
  }
};


// Delete Vehicle
export const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findByIdAndDelete(id);
    await Driver.findOneAndUpdate({ vehicleId: id }, { vehicleId: null });
    if (!vehicle) {
      return res.status(404).send({ message: 'Vehicle not found' });
    }
    res.status(200).send({message:"Vehicle deleted successfully"});
  } catch (error) {
    res.status(500).send({ message: 'Error deleting vehicle', details: error.message });
  }
};
