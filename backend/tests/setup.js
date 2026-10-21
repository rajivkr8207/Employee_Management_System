import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import redis from '../src/config/redis.js';
// Mock Redis methods globally for all tests
redis.get = async () => null;
redis.set = async () => 'OK';
redis.setex = async () => 'OK';
redis.del = async () => 1;
redis.on = () => {};
redis.quit = async () => 'OK';

let mongoServer;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
  await redis.quit();
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
