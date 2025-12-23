import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { UsersController } from './users.controller';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './users.validation';

const router = express.Router();

router.get('/', auth(), UsersController.getUsers);

router.get('/:id', auth(), UsersController.getUserById);

router.delete('/:id', auth(), UsersController.deleteUser);

router.post('/', auth(), validateRequest(UserValidation.createUser), UsersController.createUser);

router.patch(
  '/:id',
  auth(),
  validateRequest(UserValidation.updateUser),
  UsersController.updateUser,
);

export const UsersRouters = router;
