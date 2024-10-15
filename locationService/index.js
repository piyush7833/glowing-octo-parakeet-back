// server.js
import { Server } from 'socket.io';
import './app.js'; // Import to ensure initialization
import socketHandlers from './socket/socketHandler.js';
import dotenv from "dotenv";
import http from "http";
dotenv.config();
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins, you can specify specific origins if needed
    methods: ["GET", "POST"]
  }
});

socketHandlers(io);

server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
