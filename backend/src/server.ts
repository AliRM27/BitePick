import { app } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";

const startServer = async () => {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down...`);

      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
