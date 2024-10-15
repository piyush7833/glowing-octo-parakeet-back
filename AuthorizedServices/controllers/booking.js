import Booking from "../models/Booking.js";
// import { io } from "../index.js";
import Driver from "../models/Driver.js";
import { io } from "../index.js";
export var activeBookings = {};

// export const createBooking = async (req, res) => {
//   try {
//     const { src, destn, vehicleType, price, srcName, destnName, distance } = req.body;
//     const booking = new Booking({
//       src: { type: "Point", coordinates: [src.lng, src.lat] },
//       destn: { type: "Point", coordinates: [destn.lng, destn.lat] },
//       distance,
//       price,
//       srcName,
//       destnName,
//       status: "pending",
//     });
//     await booking.save();

//     const notification = { srcName, destnName, distance, price };
//     const drivers = await getNearByDrivers(src, vehicleType);

//     if (drivers.length === 0) {
//       res.status(404).json({ message: "No nearby drivers found" });
//       return;
//     }

//     const bookingId = booking._id.toString();
//     activeBookings[bookingId] = { booking, notifiedDrivers: [] };

//     // Notify drivers
//     notifyDrivers(drivers, booking, notification, bookingId);

//     res.status(201).json({ booking });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to create booking" });
//   }
// };

// const notifyDrivers = (drivers, booking, notification, bookingId) => {
//   drivers.forEach((driver) => {
//     const driverId = driver._id.toString();
//     io.to(driverId).emit("newBooking", { booking, notification });
//     activeBookings[bookingId].notifiedDrivers.push(driverId);
//   });

//   let elapsed = 0;
//   const interval = setInterval(() => {
//     if (elapsed >= 60000 || activeBookings[bookingId]?.driverAssigned) {
//       clearInterval(interval);
//       delete activeBookings[bookingId];
//     } else {
//       activeBookings[bookingId].notifiedDrivers.forEach((driverId) => {
//         io.to(driverId).emit("newBooking", { booking, notification });
//       });
//       elapsed += 5000;
//     }
//   }, 5000);
// };



export const getBooking = async (req, res) => {
    try {
        const driver=await Driver.findOne({userId:req.user.id});
        console.log(req.user.id)
        console.log(driver)
        let bookings;
        if(driver){
             bookings = await Booking.find({driverId: driver._id});
        }
        else{
            bookings = await Booking.find({userId: req.user.id});
        }
        if(!bookings || bookings.length === 0){
            return res.status(200).json({message: "No bookings found"});
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
    const allowedUpdates = ['status'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).send({ message: 'Invalid updates!' });
    }

    try {
        const {id} = req.params;
        const booking = await Booking.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if(Object.keys(req.body).includes('status') ){
            if(req.body.status==="completed"){
                io.emit("bookingCompleted", { booking});
                await Driver.findByIdAndUpdate(booking.driverId, { isAvailable: true });
            }
            else if(req.body.status==="cancelled"){
                    await Driver.findByIdAndUpdate(booking.driverId, { isAvailable: true });
                io.emit("bookingCancelled", { booking });
            }
            else if(req.body.status==="collected"){
                io.emit("bookingCollected", { booking });
            }
        }
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
