import express from 'express';
import { AuthRouters } from '../modules/Auth/auth.route';
import { ProfileRouters } from '../modules/profile/profile.route';
import { NotificationRoutes } from '../modules/notifications/notifications.routes';

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
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
