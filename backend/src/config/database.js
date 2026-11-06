import mongoose from 'mongoose';
import logger from './logger.js';
import Config from './config.js';

export const ConnectDB = async () => {
  try {
    await mongoose.connect(Config.mongodb_uri, { retryWrites: false });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error}`);
    throw error;
  }
};
