/**
 * Worker initialization file
 * Import this in server.ts to start BullMQ workers
 */
import './accessLab.worker';
import './checkoutExpiry.worker';

console.log('[Workers] All workers initialized');
