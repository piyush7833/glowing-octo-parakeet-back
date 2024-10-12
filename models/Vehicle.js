import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["mini-truck", "truck", "big-truck"],
    },
    numberPlate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    model: {  //model of the vehicle
      type: String,
      required: true,
      trim: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ currentLocation: "2dsphere" });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
