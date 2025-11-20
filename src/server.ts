import { Server } from 'http';
import app from './app';
import config from './config';
import { connectDatabases, disconnectDatabases } from './config/db';
import seedSuperAdmin from './app/seeding';

let server: Server | null = null;
const PORT = Number(config.port) || 9001;

async function startServer() {
  try {
    console.log('🚀 Starting server...');

    await connectDatabases();
    await seedSuperAdmin();

    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Server start failed:', err);
    process.exit(1);
  }
}

// Graceful Shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Closing services...`);

  if (server) {
    await new Promise((resolve) => server!.close(resolve));
    console.log('🛑 HTTP server stopped');
  }

  await disconnectDatabases();
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

startServer();
