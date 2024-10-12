import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";
import chalk from "chalk"; // Import chalk
import locationRoutes from "./routes/location.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
dotenv.config();

const connect = () => {
    mongoose.set('strictQuery', false);
    mongoose
        .connect(process.env.MONGO)
        .then(() => {
            console.log("Connected to DB");
        })
        .catch((err) => {
            throw err;
        });
};

const allowedOrigins = ['http://localhost:3000', 'https://iiitusnapshots.netlify.app', 'https://iiitu-snapshots.vercel.app'];

const getColorStatus = (status) => {
    if (status >= 500) return chalk.red(status);
    if (status >= 400) return chalk.yellow(status);
    if (status >= 300) return chalk.cyan(status);
    if (status >= 200) return chalk.green(status);
    return status;
};

morgan.token('status', (req, res) => {
    const status = res.statusCode;
    return getColorStatus(status);
});

app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/location", locationRoutes);

app.get("/api/getkey", (req, res, next) => res.status(200).json({ key: process.env.RZP_KEY_ID }));

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "something went wrong";
    return res.status(status).json({
        success: false,
        status: status,
        message: message,
    });
});

app.listen(8800, () => {
    connect();
    console.log("Connected to Server");
});
