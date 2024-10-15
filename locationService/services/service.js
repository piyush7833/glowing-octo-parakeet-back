// services/locationService.js
import { sendLocationUpdate } from '../config/kafkaProducer.js';
import redisClient from '../config/redis.js';
import axios from 'axios';

async function handleLocationUpdate(driverId, location) {
  try {
    const prevLocation = JSON.parse(await redisClient.get(`driverLocation:${driverId}`));

    if (!prevLocation || prevLocation.lat !== location.lat || prevLocation.lng !== location.lng) {
      // const driver = await Driver.findOne({ _id: driverId, isAvailable: true });
      // const driver = await Driver.findById(driverId);
      // if (driver && driver.isAvailable) {
      //   driver.location.coordinates = location;
      //   await driver.save();
      // }

      await axios.put(`http://localhost:8800/api/driver/update-via-location/${driverId}`, { location: location })
        .catch(err => {
          console.error('Error updating driver location:', err);
        });
       
      await redisClient.set(`driverLocation:${driverId}`, JSON.stringify(location));  
      await sendLocationUpdate(driverId, location);
    }
  } catch (err) {
    console.error('Error in handleLocationUpdate:', err);
  }
}

async function handleBookedDriverLocation(driverId, bookingId, socket) {
  try {
    const cachedLocation = JSON.parse(await redisClient.get(`driverLocation:${driverId}`));
    if (cachedLocation) {
      socket.emit('driverLocationUpdate', { bookingIds:bookingId, location: cachedLocation});
    } else {
      try {
        const driverDb = await axios.get(`http://localhost:8800/api/driver/get/${driverId}`);
        socket.emit('driverLocationUpdate', { 
          bookingIds: bookingId, 
          location: {
        lat: driverDb.data.currentLocation.coordinates[0],
        lng: driverDb.data.currentLocation.coordinates[1]
          } 
        });
      } catch (err) {
        console.error('Error fetching driver location from DB:', err);
      }
    }
  } catch (err) {
    console.error('Error in handleBookedDriverLocation:', err);
    socket.emit('error', 'Failed to fetch driver location.');
  }
}

export { handleLocationUpdate, handleBookedDriverLocation };
