import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import labTestController from './labtest.controller';
import {
  createLabTestSchema,
  getLabTestsSchema,
  getLabTestByIdSchema,
  updateLabTestSchema,
} from './labtest.validation';

const router = Router();

router.use(auth('ADMIN', 'SUPER_ADMIN'));

router.post('/', validateRequest(createLabTestSchema), labTestController.createLabTest);
router.get('/', validateRequest(getLabTestsSchema), labTestController.getLabTests);
router.get('/:labTestId', validateRequest(getLabTestByIdSchema), labTestController.getLabTestById);
router.patch('/:labTestId', validateRequest(updateLabTestSchema), labTestController.updateLabTest);

export default router;
