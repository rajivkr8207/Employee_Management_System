import { app } from './src/app.js';
import Config from './src/config/Config.js';
import { ConnectDB } from './src/config/database.js';
import logger from './src/config/logger.js';

await ConnectDB();
app.listen(Config.port, () => {
  logger.info(`Server is running on port ${Config.port}`);
});
