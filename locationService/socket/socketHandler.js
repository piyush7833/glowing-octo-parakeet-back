// socket/socketHandlers.js
import { handleLocationUpdate, handleBookedDriverLocation } from '../services/service.js';

function socketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('locationUpdate', async (event) => {
      const { driverId, location } = event;
      // console.log(driverId,location)
      await handleLocationUpdate(driverId, location);
    });

    socket.on('updateBookedDriverLocation', async (event) => {
      const { driverId, bookingId } = event;
      await handleBookedDriverLocation(driverId, bookingId, socket);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
}

export default socketHandlers;
