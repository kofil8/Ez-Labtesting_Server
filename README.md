# Ez LabTesting Backend

Backend API for Ez LabTesting, an online laboratory test ordering and result delivery platform. The service is built with Express 5, TypeScript, Prisma/PostgreSQL, Redis-backed queues, Socket.IO, Stripe payments, AWS S3 uploads, Firebase Cloud Messaging, and ACCESS lab integration.

Developed by [Engr. Kofil](https://kofil.online).

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Database and Seeding](#database-and-seeding)
- [Running the App](#running-the-app)
- [Scripts](#scripts)
- [API Surface](#api-surface)
- [Authentication](#authentication)
- [Payments and Webhooks](#payments-and-webhooks)
- [Queues and Workers](#queues-and-workers)
- [Realtime Features](#realtime-features)
- [Files and Uploads](#files-and-uploads)
- [Testing and Quality](#testing-and-quality)
- [Deployment](#deployment)
- [Operational Notes](#operational-notes)

## Overview

This backend manages the core Ez LabTesting workflows:

- Customer registration, login, refresh sessions, logout, password reset, and MFA.
- User profile management and admin user management.
- Test catalog, categories, panels, laboratories, lab test pricing, and state restrictions.
- Cart, checkout sessions, promo codes, order placement, payment confirmation, and order tracking.
- Stripe PaymentIntent and webhook handling.
- ACCESS lab submission, requisition generation/post-processing, result sync, and retry/manual-review flows.
- Notifications through persisted records, Socket.IO, Firebase Cloud Messaging, and email queues.
- Support tickets and manual review support flows.
- Super admin dashboard, admin management, audit logs, system settings, and webhook ledger diagnostics.

The API is mounted under:

```txt
/api/v1
```

Health check:

```txt
GET /health
```

Queue dashboard:

```txt
GET /admin/queues
```

The queue dashboard is protected by `SUPER_ADMIN` or `ADMIN` authentication.

## Tech Stack

- Runtime: Node.js 18+
- Package manager: Yarn 1.22+
- Language: TypeScript
- HTTP framework: Express 5
- Database ORM: Prisma 6 with PostgreSQL
- Cache/session/queue backend: Redis
- Queues: Bull and BullMQ
- Realtime: Socket.IO
- Payments: Stripe
- File storage: AWS S3
- Push notifications: Firebase Admin SDK / FCM
- Email: Nodemailer with SMTP
- Validation: Zod
- Auth: JWT access/refresh tokens, HTTP-only cookies, Redis refresh sessions, token blacklist
- Testing: Jest + ts-jest
- Linting: ESLint 9

## Project Structure

```txt
Server/
  prisma/
    schema.prisma                 Prisma schema
    migrations/                   Active Prisma migrations
    seed-*.ts                     Seed scripts
  public/
    fcm-test.html                 FCM manual test page
    socket-test.html              Socket manual test page
  src/
    app.ts                        Express app, global middleware, routes, error handling
    server.ts                     HTTP server, DB/Redis startup, queues, sockets, shutdown
    config/                       Environment, DB, Redis, queues, sockets, security
    lib/                          External service helpers
    shared/                       Shared Prisma client and utilities
    app/
      middlewares/                Auth, rate limiting, validation, error handling
      modules/                    Feature modules and route/controller/service layers
      queues/                     BullMQ queues for order/lab workflows
      workers/                    Worker process registrations
      helpers/                    Uploads, response helpers, notification processors
      services/                   Shared domain services
      seeding/                    Startup super-admin/template seeding
      utils/                      JWT, email, logging, pagination, security helpers
```

Major modules include:

- `Auth`
- `profile`
- `users`
- `categories`
- `tests-catalog`
- `panels`
- `laboratory`
- `labTest`
- `lab-centers`
- `stateRestriction`
- `cart`
- `checkout`
- `orders`
- `payment`
- `promo-codes`
- `notifications`
- `support`
- `templates`
- `review`
- `superadmin`
- `lab-integration`
- `order-tracking`
- `requisitions`
- `patients`

## Prerequisites

Install or provision:

- Node.js `>=18`
- Yarn `>=1.22.0`
- PostgreSQL
- Redis
- Stripe account and webhook secret
- AWS S3 bucket and access credentials, if using uploads
- Firebase service account, if using push notifications
- SMTP credentials, if using email delivery
- ACCESS lab credentials, if using live lab submission/result sync

## Environment Variables

The application validates environment variables at startup in `src/config/env.ts`. Missing required variables will prevent the app from booting.

Create a `.env` file in `Server/`.

```env
# App
NODE_ENV=development
PORT=7001
SERVER_URL=http://localhost:7001
BACKEND_BASE_URL=http://localhost:7001
BACKEND_FILE_URL=http://localhost:7001
FRONTEND_URL=http://127.0.0.1:3000
ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
TRUST_PROXY=

# Database / Redis
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/ezlabtesting
REDIS_URL=redis://localhost:6379/0

# JWT / Sessions
JWT_SECRET=replace-with-a-strong-secret
EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=replace-with-a-strong-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=1d
AUTH_SESSION_DEBUG=false

# Cookies
COOKIE_DOMAIN=
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false

# Super admin seed
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin
SUPER_ADMIN_GENDER=MALE
SUPER_ADMIN_ROLE=SUPER_ADMIN
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=change-me
SUPER_ADMIN_PHONE=+10000000000
IS_VERIFIED=true
SALT=12

# AWS S3
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PAYMENT_CURRENCY=usd
PROCESSING_FEE_PERCENT=0
PROCESSING_FEE_FLAT=0

# ACCESS lab integration
ACCESS_API_URL=https://access.labsvc.net
ACCESS_BASE_URL=https://access.labsvc.net
ACCESS_ORDER_URL=https://access.labsvc.net/orderAPI_landingPage.html
ACCESS_USERNAME=
ACCESS_PASSWORD=

# Google Places / Maps
GOOGLE_MAPS_API_KEY=

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_EMAIL=
SMTP_EMAIL_PASSWORD=
SMTP_FROM=
SMTP_FROM_EMAIL=noreply@ezlabtesting.com
SMTP_FROM_NAME=Ez Lab Testing
OTP_IMAGE_URL=

# Firebase Cloud Messaging
FIREBASE_SERVICE_ACCOUNT_PATH=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Checkout / order automation
CHECKOUT_SESSION_TTL_MIN=30
CHECKOUT_SESSION_CLEANUP_CRON=*/10 * * * *
STALE_ORDER_TIMEOUT_MIN=60
STALE_ORDER_TIMEOUT_CRON=*/15 * * * *
ACCESS_RESULTS_SYNC_CRON=0 */4 * * *
REQUISITION_SIGNED_URL_TTL_SECONDS=300
ADMIN_REVIEW_EMAILS=

# IP lookup
IP_GEO_PROVIDER=ipinfo
IPINFO_TOKEN=
IP_GEOLOOKUP_URL_TEMPLATE=https://ipwho.is/{ip}
IP_GEOLOOKUP_TIMEOUT_MS=3000
IP_GEO_CACHE_TTL_SECONDS=86400
PUBLIC_IP_LOOKUP_URL_TEMPLATE=https://api.ipify.org?format=json
PUBLIC_IP_LOOKUP_TIMEOUT_MS=3000
RESTRICTION_TEST_STATE=
RESTRICTION_TEST_IP=
ALLOW_PRODUCTION_RESTRICTION_TEST_OVERRIDE=false

# Rate limits
FCM_RATE_LIMIT=10000
EMAIL_RATE_LIMIT=100

# Socket.IO
SOCKET_RECONNECTION_WINDOW=5

# Legacy email config used by config/index.ts
EMAIL=
EMAIL_PASSWORD=
```

Production-specific validation:

- `FRONTEND_URL`, `SERVER_URL`, `BACKEND_BASE_URL`, and `BACKEND_FILE_URL` must not point to localhost in production.
- If `COOKIE_SAME_SITE=none`, then `COOKIE_SECURE` must be true.
- Production defaults include `https://ezlabtesting.com` and `https://www.ezlabtesting.com` as allowed origins.

## Local Development

Install dependencies:

```bash
yarn install
```

Generate Prisma client:

```bash
yarn prisma:generate
```

Apply migrations:

```bash
yarn prisma:migrate:deploy
```

Seed baseline data when needed:

```bash
yarn seed:all
```

Start the development server:

```bash
yarn dev
```

The development server uses `tsx watch src/server.ts`.

Default local URLs:

```txt
Health: http://localhost:7001/health
API:    http://localhost:7001/api/v1
Queues: http://localhost:7001/admin/queues
```

The actual port comes from `PORT`. If `PORT` is missing, the env schema defaults to `7001`.

## Database and Seeding

The Prisma datasource is PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Primary domain models:

- `User`
- `TestCategory`
- `Test`
- `TestComponent`
- `Laboratory`
- `LabTest`
- `StateRestriction`
- `DrawCenter`
- `CartItem`
- `Order`
- `OrderPatient`
- `OrderItem`
- `Requisition`
- `PromoCode`
- `OrderPromoCode`
- `TestReview`
- `ReviewHelpful`
- `OrderTrackingEvent`
- `SupportTicket`
- `SupportMessage`
- `PushToken`
- `Notification`
- `NotificationTemplate`
- `AuditLog`

Useful database commands:

```bash
yarn prisma:generate
yarn prisma:migrate:deploy
yarn prisma:studio
```

Seed commands:

```bash
yarn seed:categories
yarn seed:labs
yarn seed:tests
yarn seed:labtests
yarn seed:users
yarn seed:promocodes
yarn seed:all
```

`src/server.ts` also calls `seedSuperAdmin()` during startup, using the super-admin environment variables.

## Running the App

Development:

```bash
yarn dev
```

Production build:

```bash
yarn build
```

Production start:

```bash
yarn start
```

`yarn start` runs:

```bash
node dist/server.js
```

Startup sequence:

1. Load and validate environment.
2. Connect Prisma/PostgreSQL.
3. Connect Redis.
4. Initialize Firebase Admin.
5. Seed super admin data.
6. Create HTTP server from the Express app.
7. Initialize Socket.IO.
8. Initialize queues and queue processors.
9. Start notification cleanup.
10. Register stale-order and ACCESS result-sync cron jobs.
11. Mount Bull Board at `/admin/queues`.
12. Register notification and order-tracking sockets.
13. Listen on `PORT`.

Graceful shutdown handles `SIGINT` and `SIGTERM` by stopping cleanup, closing sockets, closing HTTP server, closing queues, and disconnecting databases.

## Scripts

```txt
yarn dev                    Start TypeScript dev server with watch mode
yarn build                  Compile TypeScript to dist/
yarn start                  Run compiled server from dist/server.js
yarn lint                   Run ESLint
yarn lint:fix               Run ESLint with auto-fix
yarn test                   Run Jest tests serially
yarn prisma:generate        Generate Prisma client
yarn prisma:migrate:deploy  Apply committed migrations
yarn prisma:studio          Open Prisma Studio
yarn seed:categories        Seed test categories
yarn seed:labs              Seed laboratories
yarn seed:users             Seed users
yarn seed:promocodes        Seed promo codes
yarn seed:tests             Seed test catalog
yarn seed:labtests          Seed lab-test pricing/availability records
yarn seed:all               Run all seed scripts in order
yarn s3:migrate             Migrate existing files to S3
```

## API Surface

All module routes are mounted under `/api/v1`.

### Auth

Base path: `/api/v1/auth`

```txt
POST /register
POST /resend-otp
POST /verify-otp
POST /login
POST /refreshtoken
POST /logout
POST /devices/:deviceId/logout
POST /forgot-password
POST /reset-password
```

### MFA

Base path: `/api/v1/auth/mfa`

```txt
POST /setup
POST /verify-setup
POST /verify
POST /verify-backup
POST /disable
GET  /status
POST /regenerate-backup-codes
POST /verify-sensitive
```

### Profile

Base path: `/api/v1/profile`

```txt
GET    /
PATCH  /
PATCH  /change-password
DELETE /
```

Profile image upload uses multipart form data with field name `file`.

### Users

Base path: `/api/v1/users`

Admin and super-admin only.

```txt
GET    /
GET    /:id
POST   /
PATCH  /:id
DELETE /:id
```

### Categories

Base path: `/api/v1/categories`

```txt
GET    /all
GET    /:categoryId
POST   /
PATCH  /:categoryId
DELETE /:categoryId
```

Create, update, and delete require `ADMIN` or `SUPER_ADMIN`.

### Tests Catalog

Base path: `/api/v1/tests`

```txt
GET    /all
GET    /:testId/components
GET    /:testId
POST   /
PATCH  /:testId
PATCH  /:testId/components
DELETE /:testId
```

Admin test image upload uses multipart form data with field name `testImage`.

### Panels

Base path: `/api/v1/panels`

```txt
GET    /
GET    /:panelId
POST   /
PATCH  /:panelId
DELETE /:panelId
```

Panel create/update supports multipart form data with field name `panelImage`.

### Lab Centers

Base path: `/api/v1/lab-centers`

```txt
GET  /
GET  /nationwide
POST /geocode
GET  /autocomplete
GET  /place-details/:placeId
GET  /:labCenterId
```

Public locator endpoints are rate limited. Google Places integration is enabled when `GOOGLE_MAPS_API_KEY` is configured.

### Laboratories

Base path: `/api/v1/laboratories`

Admin and super-admin only.

```txt
POST  /
GET   /
GET   /:laboratoryId
PATCH /:laboratoryId
DELETE /:laboratoryId
```

### Lab Tests

Base path: `/api/v1/lab-tests`

Admin and super-admin only.

```txt
POST  /
GET   /
GET   /:labTestId
PATCH /:labTestId
```

### State Restrictions

Base path: `/api/v1/state-restrictions`

```txt
GET   /location-status
POST  /
GET   /
GET   /:restrictionId
PATCH /:restrictionId
```

Only `GET /location-status` is public. Other routes require `ADMIN` or `SUPER_ADMIN`.

Alias status endpoint:

```txt
GET /api/v1/location/restriction-status
```

Location restriction checks use the real client IP from Express `req.ip` after `trust proxy` is enabled. Production defaults to `app.set('trust proxy', 1)`, which is compatible with Nginx forwarding `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host`.

Production geolocation should use IPinfo Lookup/Core:

```env
IP_GEO_PROVIDER=ipinfo
IPINFO_TOKEN=your_ipinfo_token
IP_GEO_CACHE_TTL_SECONDS=86400
```

Geo results are cached in Redis as `geoip:<ip>` for `IP_GEO_CACHE_TTL_SECONDS`. Redis cache errors are logged and do not block ordering checks. Unknown or failed geo lookups fail open.

Safe testing overrides:

```env
RESTRICTION_TEST_STATE=NY
RESTRICTION_TEST_IP=198.51.100.10
ALLOW_PRODUCTION_RESTRICTION_TEST_OVERRIDE=false
```

Overrides are ignored in production unless `ALLOW_PRODUCTION_RESTRICTION_TEST_OVERRIDE=true` is explicitly set.

Ordering restrictions are enforced on these mutation routes:

```txt
POST   /api/v1/cart/lock
POST   /api/v1/cart/sync
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:itemId
DELETE /api/v1/cart/items/:itemId
POST   /api/v1/cart/apply-promo
DELETE /api/v1/cart/promo
POST   /api/v1/cart/validate
POST   /api/v1/checkout/sessions
POST   /api/v1/checkout/sessions/:id/submit
POST   /api/v1/orders
POST   /api/v1/orders/:orderId/confirm-payment
POST   /api/v1/orders/:orderId/confirm-order
POST   /api/v1/payment/order-intent
POST   /api/v1/payment/confirm-payment-intent
```

### Cart

Base path: `/api/v1/cart`

Authenticated users only.

```txt
GET    /
GET    /lock
POST   /lock
DELETE /lock
POST   /sync
POST   /items
PATCH  /items/:itemId
DELETE /items/:itemId
POST   /apply-promo
DELETE /promo
POST   /validate
```

### Checkout

Base path: `/api/v1/checkout`

Authenticated users only.

```txt
POST /sessions
GET  /sessions/:id
POST /sessions/:id/submit
```

Checkout sessions expire based on `CHECKOUT_SESSION_TTL_MIN` and are cleaned up by cron using `CHECKOUT_SESSION_CLEANUP_CRON`.

### Orders

Base path: `/api/v1/orders`

```txt
POST /                         Customer only
GET  /resume                   Customer only
GET  /mine                     Customer only
GET  /manual-review            Admin/super-admin
GET  /user/:userId             Customer/admin/super-admin
POST /:orderId/admin-resend    Admin/super-admin
POST /:orderId/retry-access    Admin/super-admin
POST /:orderId/manual-review/approve Admin/super-admin
GET  /:orderId/tracking        Customer/admin/super-admin
GET  /:orderId/requisition     Customer/admin/super-admin
POST /:orderId/confirm-payment Customer/admin/super-admin
POST /:orderId/confirm-order   Customer/admin/super-admin
GET  /:orderId                 Customer/admin/super-admin
GET  /                         Admin/super-admin
```

### Payments

Base path: `/api/v1/payment`

```txt
POST /webhook
POST /order-intent
POST /confirm-payment-intent
```

`/webhook` must receive a raw JSON body for Stripe signature verification. This is configured before the global JSON parser in `src/app.ts`.

### Promo Codes

Base path: `/api/v1/promo-codes`

Admin and super-admin only.

```txt
GET    /
GET    /:id
POST   /
PATCH  /:id
DELETE /:id
```

### Reviews

Base path: `/api/v1/reviews`

```txt
GET    /test/:testId/me
GET    /test/:testId
GET    /:reviewId
POST   /
PUT    /:reviewId
DELETE /:reviewId
POST   /:reviewId/helpful
```

### Notifications

Base path: `/api/v1/notifications`

```txt
POST   /register
POST   /unregister
POST   /send
POST   /send-user
POST   /test-user
GET    /
GET    /unread/count
PATCH  /:id/read
PATCH  /read/all
DELETE /:id
POST   /admin/broadcast
POST   /admin/custom-broadcast
GET    /admin/stats
```

Admin notification routes require `SUPER_ADMIN` or `ADMIN`.

#### Custom Broadcast Endpoint

`POST /api/v1/notifications/admin/custom-broadcast`

Send a custom notification with user-provided title and body to targeted roles. Superadmin only.

**Request Body:**

```json
{
  "title": "System Maintenance Notice",
  "body": "The system will be down for maintenance tonight.",
  "targetRoles": ["CUSTOMER", "LAB_PARTNER", "ADMIN"],
  "data": { "actionUrl": "/dashboard" }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Custom broadcast notification sent successfully",
  "data": {
    "success": true,
    "totalQueued": 150,
    "totalUsers": 200,
    "failedCount": 0,
    "targetRoles": ["CUSTOMER", "LAB_PARTNER", "ADMIN"]
  }
}
```

- `targetRoles` must contain at least one role and cannot include `SUPER_ADMIN`.
- Message type is fixed to `ADMIN_ANNOUNCEMENT`.
- Notifications are delivered via in-app, Socket.IO, and FCM.

### Templates

Base path: `/api/v1/templates`

```txt
GET    /
GET    /:id
GET    /type/:type
POST   /
PATCH  /:id
DELETE /:id
POST   /:id/test
```

Write and test-render routes require `SUPER_ADMIN` or `ADMIN`.

### Support

Base path: `/api/v1/support`

```txt
POST  /tickets
POST  /tickets/manual-review
GET   /tickets
GET   /tickets/:ticketId
POST  /tickets/:ticketId/messages
PATCH /tickets/:ticketId/status
```

Ticket status updates require `SUPER_ADMIN`, `ADMIN`, or `LAB_PARTNER`.

### Super Admin

Base path: `/api/v1/superadmin`

Super-admin only.

```txt
GET    /dashboard-summary
GET    /admins
GET    /admins/:id
POST   /admins
PATCH  /admins/:id
POST   /admins/:id/temporary-password
DELETE /admins/:id
GET    /settings
PATCH  /settings
GET    /audit-logs
GET    /audit-logs/:id
GET    /webhook-ledger/summary
GET    /webhook-ledger/events
GET    /webhook-ledger/events/:externalEventId/diagnostics
```

## Authentication

The `auth()` middleware accepts either:

- `Authorization: Bearer <accessToken>`
- HTTP-only `accessToken` cookie

Refresh tokens are stored in HTTP-only cookies and tracked in Redis by session id. Logout and device logout remove refresh sessions. Access tokens can be blacklisted in Redis.

Cookie behavior is controlled by:

- `COOKIE_DOMAIN`
- `COOKIE_SAME_SITE`
- `COOKIE_SECURE`
- `EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`

Privileged roles have MFA enforcement:

- `ADMIN`
- `LAB_PARTNER`

If MFA is not enabled, privileged users are blocked from non-read actions except MFA setup/management and profile routes.

## Payments and Webhooks

Stripe is used for payment intents and webhook processing.

Important variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYMENT_CURRENCY`
- `PROCESSING_FEE_PERCENT`
- `PROCESSING_FEE_FLAT`

Webhook endpoint:

```txt
POST /api/v1/payment/webhook
```

Because Stripe signature verification requires the original body, `src/app.ts` mounts:

```ts
app.use('/api/v1/payment/webhook', express.raw({ type: 'application/json' }));
```

before `express.json()`.

## Queues and Workers

Redis is required for startup. The app initializes both notification queues and order/lab workflow queues.

Notification queues:

- `notification`
- `fcm`
- `email`

Workflow queues:

- ACCESS lab submission
- Checkout expiry
- Lab submission
- Manual review email
- Order success email
- Requisition post-processing
- Results sync
- Stale order timeout

Workers are imported from `src/app/workers/index.ts` during server startup.

Scheduled jobs:

- Stale order timeout: `STALE_ORDER_TIMEOUT_CRON`
- ACCESS results sync: `ACCESS_RESULTS_SYNC_CRON`
- Checkout cleanup: `CHECKOUT_SESSION_CLEANUP_CRON`

Queue dashboard:

```txt
GET /admin/queues
```

## Realtime Features

Socket.IO is initialized in `src/config/socket.ts` and attached to the HTTP server in `src/server.ts`.

Socket configuration:

- CORS origins come from the same allowed-origin logic used by HTTP routes.
- Credentials are enabled.
- Transports: `websocket`, `polling`
- Ping timeout: 20 seconds
- Ping interval: 10 seconds
- Max HTTP buffer size: 1 MB

Registered realtime modules:

- Notifications
- Order tracking

## Files and Uploads

Uploads use `multer`, `multer-s3`, and AWS S3 helpers.

Known upload fields:

- Profile image: `file`
- Test image: `testImage`
- Panel image: `panelImage`

Relevant variables:

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`
- `BACKEND_FILE_URL`
- `REQUISITION_SIGNED_URL_TTL_SECONDS`

There is also an S3 migration script:

```bash
yarn s3:migrate
```

## Testing and Quality

Run tests:

```bash
yarn test
```

Run lint:

```bash
yarn lint
```

Auto-fix lint issues:

```bash
yarn lint:fix
```

Build check:

```bash
yarn build
```

Jest is configured with:

- `preset: ts-jest`
- `testEnvironment: node`
- test roots under `src`

## Deployment

GitHub Actions workflow:

```txt
.github/workflows/deploy.yml
```

The workflow runs on:

- push to `main`
- manual `workflow_dispatch`

Pipeline:

1. Checkout.
2. Setup Node.js 20.
3. Install Yarn 1.22.22.
4. Install dependencies with frozen lockfile.
5. Generate Prisma client.
6. Build TypeScript.
7. SSH into EC2.
8. Fetch and checkout `origin/main`.
9. Install dependencies.
10. Generate Prisma client.
11. Deploy Prisma migrations.
12. Build.
13. Reload or start PM2 app.
14. Save PM2 process list.
15. Send success or failure email.

Deployment secrets expected by the workflow:

- `BACKEND_APP_DIR`
- `BACKEND_PM2_APP_NAME`
- `BACKEND_EC2_HOST`
- `BACKEND_EC2_USER`
- `SSH_PRIVATE_KEY`
- `BACKEND_EC2_PORT`
- `SMTP_SERVER`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `DEPLOY_NOTIFY_EMAIL`
- `SMTP_FROM_EMAIL`

Rollback behavior:

- The deploy script records the previous commit.
- On failure, it resets to the previous commit, reinstalls dependencies, regenerates Prisma, rebuilds, reloads/starts PM2, and saves PM2 state.

## Operational Notes

- Redis is mandatory. PostgreSQL connection errors are logged during `connectDatabases()`, but Redis failures abort startup.
- `app.set('trust proxy', 1)` is enabled in `src/app.ts`. `TRUST_PROXY` is also parsed in security config for deployment-specific proxy behavior.
- CORS and trusted-origin enforcement use `ALLOWED_ORIGINS`, `FRONTEND_URL`, and environment defaults.
- Request bodies are limited to 10 MB after the Stripe webhook raw parser.
- Helmet is enabled with content security policy disabled and cross-origin resource policy set to `cross-origin`.
- Global rate limiting uses Redis-backed middleware.
- API responses for missing routes return a structured 404 JSON response.
- Global errors are handled by `src/app/middlewares/globalErrorHandler.ts`.
- Logs are written through Morgan and the app logger.
- `logs/`, `dist/`, `node_modules/`, uploads, and local environment files should not be committed.

## Troubleshooting

### Startup fails with environment validation errors

Check that every required variable in `.env` is present:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ACCESS_USERNAME`
- `ACCESS_PASSWORD`

### Redis connection fails

Confirm Redis is running and that `REDIS_URL` points to the correct host, port, password, and database index.

Example local URL:

```env
REDIS_URL=redis://localhost:6379/0
```

### Stripe webhook verification fails

Confirm:

- The endpoint is `/api/v1/payment/webhook`.
- The webhook secret matches `STRIPE_WEBHOOK_SECRET`.
- The request is sent as `application/json`.
- No proxy or middleware modifies the body before it reaches Express.

### Cookies do not work across domains

For cross-site production cookies, use:

```env
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
COOKIE_DOMAIN=.ezlabtesting.com
```

Also ensure frontend requests include credentials and the frontend origin is included in `ALLOWED_ORIGINS`.

### S3 uploads fail

Check:

- AWS credentials are valid.
- Bucket exists.
- Region matches the bucket region.
- The IAM user/role can put, get, and delete objects for the configured bucket.

### Firebase push notifications fail

Use either:

- `FIREBASE_SERVICE_ACCOUNT_PATH`, or
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`

Ensure private keys preserve newline formatting when stored in environment variables.
