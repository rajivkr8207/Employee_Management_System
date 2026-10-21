import mongoose from 'mongoose';
import Config from './Config.js';
import logger from './logger.js';

export const ConnectDB = async () => {
  try {
    await mongoose.connect(Config.mongodb_uri, { retryWrites: false });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error}`);
    throw error;
  }
};
