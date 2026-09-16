import app from "./app.js";
import { testDbConnection } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function startServer() {
  logger.info("Initializing FitNation AI backend services...");

  // Verify DB connection
  await testDbConnection();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 FitNation AI backend server listening on http://localhost:${env.PORT}`);
    logger.info(`⚡ Environment: ${env.NODE_ENV} | AI Provider: ${env.AI_PROVIDER}`);
  });

  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Gracefully terminating server...`);
    server.close(() => {
      logger.info("Server closed successfully.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err) => {
  logger.error("Failed to bootstrap server:", { error: err.message, stack: err.stack });
  process.exit(1);
});
