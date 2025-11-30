import http from 'http';
import app from './app';
import config from './config';
import { connectDatabases, disconnectDatabases } from './config/db';
import seedSuperAdmin from './app/seeding';

let server: http.Server | null = null;
const PORT = Number(config.port) || 9001;

async function startServer() {
  try {
    console.log('🚀 Starting server...');

    await connectDatabases();
    await seedSuperAdmin();

    // create http server and attach express app
    server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal} — stopping server...`);
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    console.log('🛑 HTTP server stopped');
  }

  await disconnectDatabases();
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

startServer();
