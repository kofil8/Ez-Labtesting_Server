import http from 'http';
import app from './app';
import {
  startNotificationCleanup,
  stopNotificationCleanup,
} from './app/helpers/notificationCleanup';
import { initializeQueueProcessors } from './app/helpers/notificationQueue.processor';
import auth from './app/middlewares/auth';
import { initNotificationSocket } from './app/modules/notifications/notifications.socket';
import seedSuperAdmin from './app/seeding';
import config from './config';
import { initializeBullBoard } from './config/bullBoard';
import { connectDatabases, disconnectDatabases } from './config/db';
import { closeQueues, initializeQueues } from './config/queue';
import { closeSocketIO, initializeSocketIO } from './config/socket';

let server: http.Server | null = null;
const PORT = Number(config.port) || 9001;

async function startServer() {
  try {
    console.log('🚀 Starting server...');

    // Connect databases
    await connectDatabases();
    console.log('📦 Databases connected');

    // Seed super admin and notification templates
    await seedSuperAdmin();

    // Create HTTP server and attach express app
    server = http.createServer(app);

    // Initialize Socket.IO
    const io = initializeSocketIO(server);
    console.log('⚡ Socket.IO initialized');

    // Initialize Bull queues
    initializeQueues();
    console.log('📋 Bull queues initialized');

    // Initialize queue processors
    initializeQueueProcessors();
    console.log('⚙️ Queue processors initialized');

    // Setup Bull Board monitoring dashboard
    const bullBoardRouter = initializeBullBoard();
    app.use('/admin/queues', auth('SUPER_ADMIN', 'ADMIN'), bullBoardRouter);
    console.log('📊 Bull Board dashboard mounted at /admin/queues');

    // Initialize notification socket events
    initNotificationSocket(io);
    console.log('📬 Notification socket events initialized');

    // Start notification cleanup job
    startNotificationCleanup();
    console.log('🧹 Notification cleanup job started');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}/health`);
      console.log(`📬 Real-time notifications active`);
      console.log(`📊 Bull Board dashboard: http://localhost:${PORT}/admin/queues`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal} — stopping server...`);

  // Stop notification cleanup job
  stopNotificationCleanup();

  // Close Socket.IO connections
  await closeSocketIO();

  // Close HTTP server
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    console.log('🛑 HTTP server stopped');
  }

  // Close queues
  await closeQueues();

  // Disconnect databases
  await disconnectDatabases();

  console.log('✅ Graceful shutdown complete');
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

startServer();
