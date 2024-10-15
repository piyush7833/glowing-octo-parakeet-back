// services/kafkaConsumer.js
import { consumer } from '../config/kafka.js';
import redisClient from '../config/redis.js';

function runConsumer() {
  consumer.on('message', async (message) => {
    try {
      const data = JSON.parse(message.value);
      const { driverId, location } = data;

      await redisClient.set(`driverLocation:${driverId}`, JSON.stringify(location));
    } catch (err) {
      console.error('Error updating Redis cache:', err);
    }
  });

  consumer.on('error', (err) => {
    console.error('Kafka Consumer Error:', err);
  });
}

export { runConsumer };
