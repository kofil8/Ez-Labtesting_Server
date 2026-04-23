/**
 * Worker initialization file
 * Import this in server.ts to start BullMQ workers
 */
import './labSubmission.worker';
import './manualReviewEmail.worker';
import './orderSuccessEmail.worker';
import './requisitionPostProcessing.worker';
import './resultsSync.worker';
import './staleOrderTimeout.worker';
import './checkoutExpiry.worker';

console.log('[Workers] All workers initialized');
