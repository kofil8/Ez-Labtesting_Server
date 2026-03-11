import { Role } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminValidation } from './superadmin.validation';

const router = express.Router();

/* ==========================================
   ADMIN MANAGEMENT ROUTES
========================================== */

// Dashboard summary
router.get('/dashboard-summary', auth(Role.SUPER_ADMIN), SuperAdminController.getDashboardSummary);

// Get all admins
router.get('/admins', auth(Role.SUPER_ADMIN), SuperAdminController.getAdmins);

// Get admin by ID
router.get('/admins/:id', auth(Role.SUPER_ADMIN), SuperAdminController.getAdminById);

// Create new admin
router.post(
  '/admins',
  auth(Role.SUPER_ADMIN),
  validateRequest(SuperAdminValidation.createAdmin),
  SuperAdminController.createAdmin,
);

// Update admin
router.patch(
  '/admins/:id',
  auth(Role.SUPER_ADMIN),
  validateRequest(SuperAdminValidation.updateAdmin),
  SuperAdminController.updateAdmin,
);

// Set temporary password for an admin
router.post(
  '/admins/:id/temporary-password',
  auth(Role.SUPER_ADMIN),
  SuperAdminController.setTemporaryPassword,
);

// Delete admin
router.delete('/admins/:id', auth(Role.SUPER_ADMIN), SuperAdminController.deleteAdmin);

/* ==========================================
   SYSTEM SETTINGS ROUTES
========================================== */

// Get system settings
router.get('/settings', auth(Role.SUPER_ADMIN), SuperAdminController.getSystemSettings);

// Update system setting
router.patch(
  '/settings',
  auth(Role.SUPER_ADMIN),
  validateRequest(SuperAdminValidation.updateSetting),
  SuperAdminController.updateSystemSetting,
);

/* ==========================================
   AUDIT LOG ROUTES
========================================== */

// Get audit logs
router.get('/audit-logs', auth(Role.SUPER_ADMIN), SuperAdminController.getAuditLogs);

// Get audit log by ID
router.get('/audit-logs/:id', auth(Role.SUPER_ADMIN), SuperAdminController.getAuditLogById);

/* ==========================================
   WEBHOOK LEDGER ROUTES
========================================== */

// Webhook ledger summary by status/retries/stale processing
router.get(
  '/webhook-ledger/summary',
  auth(Role.SUPER_ADMIN),
  SuperAdminController.getWebhookLedgerSummary,
);

// Webhook ledger event list with filters
router.get(
  '/webhook-ledger/events',
  auth(Role.SUPER_ADMIN),
  SuperAdminController.getWebhookLedgerEvents,
);

// Single event replay diagnostics
router.get(
  '/webhook-ledger/events/:externalEventId/diagnostics',
  auth(Role.SUPER_ADMIN),
  SuperAdminController.getWebhookReplayDiagnostics,
);

export const SuperAdminRouters = router;
