import express from 'express';
import upload, { setS3Folder } from '../../helpers/fileUploadHelper';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PanelController } from './panels.controller';
import { PanelValidation } from './panels.validation';

const router = express.Router();

// 📖 PUBLIC ROUTES - Users can view panels
// Get all panels with filters, search, pagination
router.get('/', validateRequest(PanelValidation.getPanelsQuery), PanelController.getPanels);

// Get panel by ID
router.get(
  '/:panelId',
  validateRequest(PanelValidation.getPanelById),
  PanelController.getPanelById,
);

// 🔐 ADMIN ROUTES - Only admin can CRUD
// Create panel
router.post(
  '/',
  auth('ADMIN', 'SUPER_ADMIN'),
  setS3Folder('panels'),
  upload.single('panelImage'),
  PanelController.createPanel,
);

// Update panel
router.patch(
  '/:panelId',
  auth('ADMIN', 'SUPER_ADMIN'),
  setS3Folder('panels'),
  upload.single('panelImage'),
  PanelController.updatePanel,
);

// Delete panel
router.delete(
  '/:panelId',
  auth('ADMIN', 'SUPER_ADMIN'),
  validateRequest(PanelValidation.deleteTestPanel),
  PanelController.deletePanel,
);

export const PanelsRoutes = router;
