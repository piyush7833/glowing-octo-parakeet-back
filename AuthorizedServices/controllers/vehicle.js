import { validationResult } from 'express-validator';
import Vehicle from '../models/Vehicle.js'; // Adjust the import path based on your project structure
import Driver from '../models/Driver.js';
import mongoose from 'mongoose';
import { delAsync, setAsync } from '../config/redis.js';
export const createVehicle= async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ message: firstError.msg });
  }

  const { type, numberPlate, model } =
    req.body;

  try {
    const adminCacheKey=`admin-vehicles:${req.user.id}`;
    const newVehicle = new Vehicle({
      type,
      numberPlate,
      model,
      adminId: req.user.id,
    });

    await newVehicle.save();
    delAsync(adminCacheKey);
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
    const adminCacheKey=`admin-vehicles:${req.user.id}`;
    const cachedVehicles=await getAsync(adminCacheKey);
    if(cachedVehicles){
      return res.status(200).send({data:{vehicles:JSON.parse(cachedVehicles)},message:"Vehicles fetched successfully"});
    }
    const vehicles = await Vehicle.find({ adminId: req.user.id })
      .populate({
        path: "driverId",
        select: "licenseNumber",
        populate: {
          path: "userId",
          select: "name"
        }
      }).exec();
    const vehicleDetails = vehicles.map(vehicle => ({
      _id: vehicle._id,
      type: vehicle.type,
      numberPlate: vehicle.numberPlate,
      model: vehicle.model,
      driver: vehicle.driverId ? {
        licenseNumber: vehicle.driverId.licenseNumber,
        name: vehicle.driverId.userId ? vehicle.driverId.userId.name : null
      } : null
    }));
    setAsync(adminCacheKey, JSON.stringify(vehicleDetails));
    res.status(200).send({
      data: {
      vehicles: vehicleDetails
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
    const cacheKey=`vehicle:${id}`;
    const cachedVehicle=await getAsync(cacheKey);
    if(cachedVehicle){
      return res.status(200).send({data:{vehicle:JSON.parse(cachedVehicle)},message:"Vehicle fetched successfully"});
    }
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
    const vehicleData={
      _id: vehicle._id,
      type: vehicle.type,
      numberPlate: vehicle.numberPlate,
      model: vehicle.model,
      driver: vehicle.driverId ? {
      licenseNumber: vehicle.driverId.licenseNumber,
      name: vehicle.driverId.userId ? vehicle.driverId.userId.name : null
      } : null
    };
    setAsync(cacheKey, JSON.stringify(vehicleData));
    res.status(200).send({data:{vehicle:vehicleData},message:"Vehicle fetched successfully"});
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
    
    const cacheKey=`vehicle:${id}`;
    let driver
    let driverAdminCacheKey;
    // Handle driverId value
    if (req.body.driverId === "Remove Driver") {
      updateData.driverId = null;
      driver=await Driver.findOneAndUpdate({ vehicleId: id }, { vehicleId: null });
      driverAdminCacheKey=`admin-drivers:${driver.adminId}`;
      delAsync(driverAdminCacheKey);
    } else if (req.body.driverId && !mongoose.isValidObjectId(req.body.driverId)) {
      return res.status(400).send({ message: 'Invalid driver ID' });
    }

    // Update driver information if a valid driverId is provided
    if (updateData.driverId) {
      driver=await Driver.findOneAndUpdate({ _id: updateData.driverId }, { vehicleId: id });
      driverAdminCacheKey=`admin-drivers:${driver.adminId}`;
      delAsync(driverAdminCacheKey);
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
    const vehicleAdminCacheKey=`admin-vehicles:${vehicle.adminId}`;
    delAsync(vehicleAdminCacheKey);
    setAsync(cacheKey, JSON.stringify(vehicle));
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
    const driver =await Driver.findOneAndUpdate({ vehicleId: id }, { vehicleId: null });
    const driverAdminCacheKey=`admin-drivers:${driver.adminId}`;
    delAsync(driverAdminCacheKey);
    const vehicleAdminCacheKey=`admin-vehicles:${vehicle.adminId}`;
    delAsync(vehicleAdminCacheKey);
    if (!vehicle) {
      return res.status(404).send({ message: 'Vehicle not found' });
    }
    res.status(200).send({message:"Vehicle deleted successfully"});
  } catch (error) {
    res.status(500).send({ message: 'Error deleting vehicle', details: error.message });
  }
};
