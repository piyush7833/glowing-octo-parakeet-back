import mongoose from "mongoose";
import Driver from "../models/Driver.js";
import Vehicle from "../models/Vehicle.js";

export const getDriverAnalytics = async (req, res) => {
    try {
        const driverId = req.params.id;
        console.log(driverId)
        const { ObjectId } = mongoose.Types;
        const driverAnalytics = await Driver.aggregate([
            {
            $match: { _id: new ObjectId(driverId) }
            },
            {
            $lookup: {
                from: "bookings",
                localField: "_id",
                foreignField: "driverId",
                as: "bookings",
            },
            },
            {
            $unwind: "$bookings",
            },
            {
            $group: {
                _id: "$_id",
                totalEarnings: { $sum: "$bookings.price" },
                totalTrips: { $sum: 1 },
                totalDuration: { 
                $sum: {
                    $let: {
                    vars: {
                        parts: { $split: ["$bookings.duration", " "] }
                    },
                    in: {
                        $add: [
                        { $multiply: [{ $toInt: { $arrayElemAt: ["$$parts", 0] } }, 3600] },
                        { $multiply: [{ $toInt: { $arrayElemAt: ["$$parts", 2] } }, 60] }
                        ]
                    }
                    }
                }
                },
                totalDistance: { $sum: "$bookings.distance" },
                isAvailable: { $first: "$isAvailable" },
                runningTrip: {
                $first: {
                    $cond: {
                    if: { $eq: ["$isAvailable", false] },
                    then: {
                        srcName: "$bookings.srcName",
                        destnName: "$bookings.destnName"
                    },
                    else: null
                    }
                }
                }
            }
            },
            {
            $project: {
                _id: 1,
                totalEarnings: 1,
                totalTrips: 1,
                totalDuration: {
                $let: {
                    vars: {
                    hours: { $floor: { $divide: ["$totalDuration", 3600] } },
                    minutes: { $floor: { $mod: [{ $divide: ["$totalDuration", 60] }, 60] } }
                    },
                    in: {
                    $concat: [
                        { $toString: "$$hours" }, " hr ",
                        { $toString: "$$minutes" }, " mins"
                    ]
                    }
                }
                },
                totalDistance: 1,
                isAvailable: 1,
                runningTrip: 1
            }
            }
        ]);
        return res.status(200).json({data:{driverAnalytics}});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch driver analytics" });
    }
}


export const getVehicleAnalytics = async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const { ObjectId } = mongoose.Types;
        const vehicleAnalytics = await Vehicle.aggregate([
            {
            $match: { _id: new ObjectId(vehicleId) }
            },
            {
            $lookup: {
                from: "bookings",
                localField: "_id",
                foreignField: "vehicleId",
                as: "bookings",
            },
            },
            {
            $unwind: "$bookings",
            },
            {
            $match: {
                "bookings.status": "completed"
            }
            },
            {
            $group: {
                _id: "$_id",
                totalEarnings: { $sum: "$bookings.price" },
                totalTrips: { $sum: 1 },
                totalDuration: { 
                $sum: {
                    $let: {
                    vars: {
                        parts: { $split: ["$bookings.duration", " "] }
                    },
                    in: {
                        $add: [
                        { $multiply: [{ $toInt: { $arrayElemAt: ["$$parts", 0] } }, 3600] },
                        { $multiply: [{ $toInt: { $arrayElemAt: ["$$parts", 2] } }, 60] }
                        ]
                    }
                    }
                }
                },
                totalDistance: { $sum: "$bookings.distance" }
            }
            },
            {
            $project: {
                _id: 1,
                totalEarnings: 1,
                totalTrips: 1,
                totalDuration: {
                $let: {
                    vars: {
                    hours: { $floor: { $divide: ["$totalDuration", 3600] } },
                    minutes: { $floor: { $mod: [{ $divide: ["$totalDuration", 60] }, 60] } }
                    },
                    in: {
                    $concat: [
                        { $toString: "$$hours" }, " hr ",
                        { $toString: "$$minutes" }, " mins"
                    ]
                    }
                }
                },
                totalDistance: 1,
            }
            }
        ]);
        return res.status(200).json({data:{vehicleAnalytics}});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch vehicle analytics" });
    }
}