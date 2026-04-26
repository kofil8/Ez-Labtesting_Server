import http from 'http';
import app from './app';
import { startNotificationCleanup, stopNotificationCleanup } from './app/helpers/notificationCleanup';
import { initializeQueueProcessors } from './app/helpers/notificationQueue.processor';
import auth from './app/middlewares/auth';
import { initNotificationSocket } from './app/modules/notifications/notifications.socket';
import { initOrderTrackingSocket } from './app/modules/orders/orders.socket';
import { ensureResultsSyncCron } from './app/queues/resultsSync.queue';
import { ensureStaleOrderTimeoutCron } from './app/queues/staleOrderTimeout.queue';
import seedSuperAdmin from './app/seeding';
import './app/workers';
import config from './config';
import { initializeBullBoard } from './config/bullBoard';
import { connectDatabases, disconnectDatabases } from './config/db';
import { closeQueues, initializeQueues } from './config/queue';
import { closeSocketIO, initializeSocketIO } from './config/socket';
import { getFirebaseAdmin } from './lib/firebaseAdmin';

let server: http.Server | null = null;
const PORT = Number(config.port) || 9001;

async function startServer() {
  try {
    await connectDatabases();
    getFirebaseAdmin();
    await seedSuperAdmin();

    server = http.createServer(app);
    const io = initializeSocketIO(server);

    initializeQueues();
    initializeQueueProcessors();
    startNotificationCleanup();
    await ensureStaleOrderTimeoutCron();
    await ensureResultsSyncCron();

    const bullBoardRouter = initializeBullBoard();
    app.use('/admin/queues', auth('SUPER_ADMIN', 'ADMIN'), bullBoardRouter);

    initNotificationSocket(io);
    initOrderTrackingSocket(io);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, shutting down`);

  stopNotificationCleanup();
  await closeSocketIO();

  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
  }

  await closeQueues();
  await disconnectDatabases();
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

startServer();
