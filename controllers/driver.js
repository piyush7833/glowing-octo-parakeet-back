import { validationResult } from "express-validator";
import Driver from "../models/Driver.js";

export const getNearByDrivers=async(src)=>{
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
                      $centerSphere: [
                        [src.lng, src.lat],
                        5 / 6378.1,
                      ],
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
    
          return drivers
        } catch (error) {
          console.error(error);
          throw new Error("An error occurred while fetching nearby drivers.");
        }
      }