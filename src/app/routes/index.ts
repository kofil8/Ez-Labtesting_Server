import express from 'express';
import { AuthRouters } from '../modules/Auth/auth.route';
import { ProfileRouters } from '../modules/profile/profile.route';
import { UserRouters } from '../modules/Users/user.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/profile',
    route: ProfileRouters,
  },
  // {
  //   path: '/users',
  //   route: UserRouters,
  // },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
