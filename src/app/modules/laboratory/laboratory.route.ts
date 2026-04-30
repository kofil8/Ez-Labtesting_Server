import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import laboratoryController from './laboratory.controller';
import {
  createLaboratorySchema,
  getLaboratoriesSchema,
  getLaboratoryByIdSchema,
  updateLaboratorySchema,
} from './laboratory.validation';

const router = Router();

router.use(auth('ADMIN', 'SUPER_ADMIN'));

router.post('/', validateRequest(createLaboratorySchema), laboratoryController.createLaboratory);
router.get('/', validateRequest(getLaboratoriesSchema), laboratoryController.getLaboratories);
router.get(
  '/:laboratoryId',
  validateRequest(getLaboratoryByIdSchema),
  laboratoryController.getLaboratoryById,
);
router.patch(
  '/:laboratoryId',
  validateRequest(updateLaboratorySchema),
  laboratoryController.updateLaboratory,
);
router.delete(
  '/:laboratoryId',
  validateRequest(getLaboratoryByIdSchema),
  laboratoryController.deleteLaboratory,
);

export default router;
