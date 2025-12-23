import express from 'express';
import { AuthRouters } from '../modules/Auth/auth.route';
import { NotificationRoutes } from '../modules/notifications/notifications.routes';
import { ProfileRouters } from '../modules/profile/profile.route';
import { TemplatesRoutes } from '../modules/templates/templates.routes';
import { UsersRouters } from '../modules/users/users.route';
import { TestsRouters } from '../modules/tests/tests.route';

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
  {
    path: '/users',
    route: UsersRouters,
  },
  {
    path: '/templates',
    route: TemplatesRoutes,
  },
  {
    path: '/tests',
    route: TestsRouters,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
