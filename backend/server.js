import { createServer, get } from 'node:http';
import { setInterval } from 'node:timers';
import { app } from './src/app.js';
import Config from './src/config/config.js';
import { ConnectDB } from './src/config/database.js';
import { initializeSocket } from './src/config/socket.js';
import logger from './src/config/logger.js';
import { bootstrapInitialAdmin } from './src/utils/bootstrapAdmin.js';

await ConnectDB();
await bootstrapInitialAdmin();

const server = createServer(app);
initializeSocket(server);

server.listen(Config.port, () => {
  logger.info(`[Server] Server is running on port ${Config.port}`);

  const address = server.address();
  if (!address || typeof address === 'string') {
    logger.error('[Healthcheck] Could not determine the server port');
    return;
  }

  const healthCheckUrl = `${Config.backendUrl}/api/v1/health`;
  setInterval(
    () => {
      const request = get(healthCheckUrl, (response) => {
        response.resume();

        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          logger.warn(`[Healthcheck] Request returned status ${response.statusCode}`);
        }
      });

      request.on('error', (error) => {
        logger.error(`[Healthcheck] Request failed: ${error.message}`);
      });
    },
    5 * 60 * 1000,
  );
});
