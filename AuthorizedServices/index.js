import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server as SocketIoServer } from "socket.io";
import http from "http";
import Razorpay from "razorpay";

// routes
import locationRoutes from "./routes/location.js";
import authRoutes from "./routes/auth.js";
import vehicleRoutes from "./routes/vehicle.js";
import driverRoutes from "./routes/driver.js";
import priceRoutes from "./routes/price.js";
import { getNearByDrivers } from "./controllers/driver.js";
import Booking from "./models/Booking.js";
import Driver from "./models/Driver.js";
import bookingRoutes from "./routes/booking.js";
import { authenticateToken } from "./middleware/middleware.js";
import adminroutes from "./routes/admin.js";
import paymentRoutes from "./routes/payment.js";

const app = express();
const server = http.createServer(app);
export const io = new SocketIoServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
dotenv.config();

const connect = () => {
    mongoose.set("strictQuery", false);
    mongoose
        .connect(process.env.MONGO)
        .then(() => {
            console.log("Connected to DB");
        })
        .catch((err) => {
            throw err;
        });
};

const allowedOrigins = ["http://localhost:3000","http://localhost:5000"];

const getColorStatus = (status) => {
    if (status >= 500) return chalk.red(status);
    if (status >= 400) return chalk.yellow(status);
    if (status >= 300) return chalk.cyan(status);
    if (status >= 200) return chalk.green(status);
    return status;
};

morgan.token("status", (req, res) => {
    const status = res.statusCode;
    return getColorStatus(status);
});

app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let activeBookings = {};

// Route for creating a booking
app.post("/api/bookings",authenticateToken, async (req, res) => {
    try {
        const { src, destn, vehicleType, price, srcName, destnName, distance,duration } = req.body;
        const booking = new Booking({
            src: { type: "Point", coordinates: [src.lng, src.lat] },
            destn: { type: "Point", coordinates: [destn.lng, destn.lat] },
            distance, price, status: "pending",
            srcName, destnName,userId: req.user.id,
            duration
        });
        await booking.save();

        const notification = { srcName, destnName, distance, price };
        const drivers = await getNearByDrivers(src, vehicleType);

        if (drivers.length === 0) {
            res.status(404).json({ message: "No nearby drivers found" });
            return;
        }

        const bookingId = booking._id.toString();
        activeBookings[bookingId] = { booking, notifiedDrivers: [] };
        console.log(drivers)
        // Notify each driver immediately
        drivers.forEach((driver) => {
            const driverId = driver._id.toString();
            io.to(driverId).emit("newBooking", { booking, notification });
            activeBookings[bookingId].notifiedDrivers.push(driverId);
        });

        let elapsed = 0;
        const interval = setInterval(() => {
            if (
                elapsed >= 60000 ||
                !activeBookings[bookingId] ||
                activeBookings[bookingId].driverAssigned
            ) {
                clearInterval(interval);
                delete activeBookings[bookingId];
            } else {
                activeBookings[bookingId].notifiedDrivers.forEach((driverId) => {
                    io.to(driverId).emit("newBooking", { booking,notification });
                });
                elapsed += 5000;
            }
        }, 5000);

        res.status(201).json({ booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create booking" });
    }
});


export const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

app.use("/api/location", locationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/driver", driverRoutes); 
app.use("/api/price", priceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.get("/api/getkey", (req, res) =>
    res.status(200).json({ key: process.env.RZP_KEY_ID })
);
app.use("/api/admin",adminroutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = err.message || "Something went wrong";
    res.status(status).json({ success: false, message });
});


// Socket.IO configuration
io.on("connection", (socket) => {
    console.log(`Driver connected: ${socket.id}`);

    // Event to register a driver and join a room
    socket.on("registerDriver", (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`Driver registered: ${userId} and joined room: ${userId}`);
        } else {
            console.log("Driver registration failed: Invalid userId");
        }
    });

    // Event for accepting a booking
    socket.on("acceptBooking", async ({ bookingId, driverId }) => {
        const bookingData = activeBookings[bookingId];
        if (!bookingData || bookingData.driverAssigned) return;
        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            { driverId, status: "accepted"},
            { new: true }
        );
        const driver = await Driver.findByIdAndUpdate(booking.driverId, {isAvailable: false}).populate("userId","name");
        await Booking.findByIdAndUpdate(bookingId,{vehicleId: driver.vehicleId});

        io.emit("bookingAccepted", { booking,driverName: driver.userId.name,driverId });
        activeBookings[bookingId].driverAssigned = true;

        socket.to(bookingData.notifiedDrivers).emit("bookingCancelled", { bookingId });
    });

    // Event for rejecting a booking
    socket.on("rejectBooking", ({ bookingId, driverId }) => {
        const bookingData = activeBookings[bookingId];
        if (!bookingData) return;

        const index = bookingData.notifiedDrivers.indexOf(driverId);
        if (index !== -1) {
            bookingData.notifiedDrivers.splice(index, 1);
        }
    });

    // Handle driver disconnection
    socket.on("disconnect", () => {
        console.log(`Driver disconnected: ${socket.id}`);
    });
});

// Start server
server.listen(8800, () => {
    connect();
    console.log("Connected to Server");
});
