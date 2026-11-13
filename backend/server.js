import { createServer } from 'node:http';
import { app } from './src/app.js';
import Config from './src/config/config.js';
import { ConnectDB } from './src/config/database.js';
import { verifyMailConnection } from './src/config/mail.js';
import { initializeSocket } from './src/config/socket.js';
import logger from './src/config/logger.js';
import { bootstrapInitialAdmin } from './src/utils/bootstrapAdmin.js';

await ConnectDB();
await bootstrapInitialAdmin();

const server = createServer(app);
initializeSocket(server);

server.listen(Config.port, () => {
  logger.info(`Server is running on port ${Config.port}`);
  void verifyMailConnection();
});
