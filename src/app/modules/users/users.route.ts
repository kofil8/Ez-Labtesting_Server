import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { UsersController } from './users.controller';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './users.validation';
import { Role } from '@prisma/client';

const router = express.Router();

// Self endpoints
router.get('/me', auth(), UsersController.getMe);
router.patch('/me', auth(), validateRequest(UserValidation.updateMe), UsersController.updateMe);

// Admin endpoints
router.get('/', auth(Role.ADMIN, Role.SUPER_ADMIN), UsersController.getUsers);

router.get('/:id', auth(Role.ADMIN, Role.SUPER_ADMIN), UsersController.getUserById);

router.delete('/:id', auth(Role.ADMIN, Role.SUPER_ADMIN), UsersController.deleteUser);

router.post(
  '/',
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(UserValidation.createUser),
  UsersController.createUser,
);

router.patch(
  '/:id',
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(UserValidation.updateUser),
  UsersController.updateUser,
);

export const UsersRouters = router;
