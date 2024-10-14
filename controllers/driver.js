import { validationResult } from "express-validator";
import Driver from "../models/Driver.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";

export const createDriver = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ message: firstError.msg });
  }
  try {
    const { name, username, email, password, phone, licenseNumber } = req.body;
    
    const userData = {
      name,
      username,
      email,
      phone,
      password,
      role: "driver",
    };
    const user = new User(userData);
    const newUser=await user.save();
    const driverData = {
      licenseNumber,
      adminId: req.user.id,
      userId: newUser._id,
    };
    const driver = new Driver(driverData);
    const newDriver = await driver.save();
    await user.save();
    res.status(201).json({
      data: {
        driver: {
          _id: newDriver._id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          licenseNumber: newDriver.licenseNumber,
          role: user.role,
          createdAt: newDriver.createdAt,
          updatedAt: newDriver.updatedAt,
        },
      },
      message: "Driver created successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: [
        {
          message: "An error occurred while creating the driver.",
        },
      ],
    });
  }
};

export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ adminId: req.user.id })
      .populate("userId", "name username email phone role")
      .populate("vehicleId", "model licensePlate");

    const driverDetails = drivers.map((driver) => ({
      _id: driver._id,
      name: driver.userId.name,
      username: driver.userId.username,
      email: driver.userId.email,
      phone: driver.userId.phone,
      licenseNumber: driver.licenseNumber,
      role: driver.userId.role,
      vehicle: driver.vehicleId
        ? {
            model: driver.vehicleId.model,
            numberPlate: driver.vehicleId.numberPlate,
          }
        : null,
    }));
    res
      .status(200)
      .json({
        data: { drivers: driverDetails },
        message: "Drivers fetched successfully.",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: [
        {
          message: "An error occurred while fetching drivers.",
        },
      ],
    });
  }
};

export const getParticularDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate("userId", "name username email phone role")
      .populate("vehicleId", "model licensePlate");
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }
    if (driver.adminId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this driver." });
    }
    const driverDetails = {
      _id: driver._id,
      name: driver.userId.name,
      username: driver.userId.username,
      email: driver.userId.email,
      phone: driver.userId.phone,
      licenseNumber: driver.licenseNumber,
      role: driver.userId.role,
      vehicle: driver.vehicleId
        ? {
            model: driver.vehicleId.model,
            numberPlate: driver.vehicleId.numberPlate,
          }
        : null,
    };
    res.status(200).json({ data: { driver: driverDetails } });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: [
        {
          message: "An error occurred while fetching the driver.",
        },
      ],
    });
  }
};

export const updateDriver = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ message: firstError.msg });
  }
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "licenseNumber",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ message: "Invalid updates!" });
  }

  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }
    if (driver.adminId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this driver." });
    }
    const updatedDriver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("userId", "name username email phone role")
      .populate("vehicleId", "model licensePlate");

    const driverDetails = {
      _id: updatedDriver._id,
      name: updatedDriver.userId.name,
      username: updatedDriver.userId.username,
      email: updatedDriver.userId.email,
      phone: updatedDriver.userId.phone,
      licenseNumber: updatedDriver.licenseNumber,
      role: updatedDriver.userId.role,
      vehicle: updatedDriver.vehicleId
        ? {
            model: updatedDriver.vehicleId.model,
            numberPlate: updatedDriver.vehicleId.numberPlate,
          }
        : null,
    };

    res.status(200).json({
      data: { driver: driverDetails },
      message: "Driver updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: [
        {
          message: "An error occurred while updating the driver.",
        },
      ],
    });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    await Vehicle.findOneAndUpdate({ driverId: req.params.id }, { driverId: null });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }
    if (driver.adminId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this driver." });
    }
    await User.deleteOne({ _id: driver.userId });
    await Driver.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Driver deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: [
        {
          message: "An error occurred while deleting the driver.",
        },
      ],
    });
  }
};

export const getNearByDrivers = async (src) => {
  try {
    const drivers = await Driver.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [src.lng, src.lat],
          },
          distanceField: "dist.calculated",
          maxDistance: 5000,
          spherical: true,
          query: {
            isAvailable: true,
            currentLocation: {
              $geoWithin: {
                $centerSphere: [[src.lng, src.lat], 5 / 6378.1],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicleDetails",
        },
      },
      {
        $unwind: {
          path: "$vehicleDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {
          "dist.calculated": 1,
        },
      },
    ]);

    return drivers;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while fetching nearby drivers.");
  }
};
