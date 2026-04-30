import express from 'express';
import auth from '../../middlewares/auth';
import { supportController } from './support.controller';
import {
  validateAddMessage,
  validateCreateManualReviewTicket,
  validateCreateTicket,
  validateGetTicketsQuery,
  validateTicketParams,
  validateUpdateStatus,
} from './support.validation';

const router = express.Router();

router.post('/tickets', auth(), validateCreateTicket, supportController.createTicket);
router.post(
  '/tickets/manual-review',
  auth(),
  validateCreateManualReviewTicket,
  supportController.createManualReviewTicket,
);

router.get('/tickets', auth(), validateGetTicketsQuery, supportController.listTickets);

router.get('/tickets/:ticketId', auth(), validateTicketParams, supportController.getTicketById);

router.post(
  '/tickets/:ticketId/messages',
  auth(),
  validateTicketParams,
  validateAddMessage,
  supportController.addMessage,
);

router.patch(
  '/tickets/:ticketId/status',
  auth('SUPER_ADMIN', 'ADMIN', 'LAB_PARTNER'),
  validateTicketParams,
  validateUpdateStatus,
  supportController.updateStatus,
);

export const SupportRoutes = router;
