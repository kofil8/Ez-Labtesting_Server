import express from 'express';
import { AuthRouters } from '../modules/Auth/auth.route';
import { MFARouters } from '../modules/Auth/mfa.routes';
import CategoriesRoutes from '../modules/categories/categories.route';
import { LabCenterRoutes } from '../modules/lab-centers/lab-centers.route';
import { NotificationRoutes } from '../modules/notifications/notifications.routes';
import { OrderRoutes } from '../modules/orders/orders.route';
import { PanelsRoutes } from '../modules/panels/panels.route';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { ProfileRouters } from '../modules/profile/profile.route';
import { ReviewRoutes } from '../modules/review/review.route';
import { SuperAdminRouters } from '../modules/superadmin/superadmin.route';
import { SupportRoutes } from '../modules/support/support.route';
import { TemplatesRoutes } from '../modules/templates/templates.routes';
import { TestsRouters } from '../modules/tests/tests.route';
import { UsersRouters } from '../modules/users/users.route';
import { CheckoutRoutes } from '../modules/checkout/checkout.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/auth/mfa',
    route: MFARouters,
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
    path: '/categories',
    route: CategoriesRoutes,
  },
  {
    path: '/tests',
    route: TestsRouters,
  },
  {
    path: '/panels',
    route: PanelsRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
  {
    path: '/payment',
    route: PaymentRoutes,
  },
  {
    path: '/checkout',
    route: CheckoutRoutes,
  },
  {
    path: '/orders',
    route: OrderRoutes,
  },
  {
    path: '/superadmin',
    route: SuperAdminRouters,
  },
  {
    path: '/lab-centers',
    route: LabCenterRoutes,
  },
  {
    path: '/support',
    route: SupportRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
