import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, ErrorRequestHandler, Request, Response } from 'express';
import helmet from 'helmet';
import httpStatus from 'http-status';
import morgan from 'morgan';
import path from 'path';
import GlobalErrorHandler from './app/middlewares/globalErrorHandler';
import { defaultLimiter } from './app/middlewares/rateLimit';
import router from './app/routes';
import logger from './app/utils/logger';

const app: Application = express();
const morganFormat = ':method :url :status :response-time ms';

app.set('trust proxy', true);

// 🧩 Global middlewares
const corsOptions = {
  // Allow the Next.js dev server and any comma-separated origins in ALLOWED_ORIGINS
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://ezlabtesting.com']
      : ['http://localhost:3000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// 🔧 Middleware setup
app.use(cors(corsOptions));
app.use(defaultLimiter);

// ⚠️ CRITICAL: Webhook route MUST receive raw body for signature verification
// Apply raw body parser to webhook endpoint BEFORE JSON parser
app.use('/api/v1/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(morganFormat));
app.use(compression());
app.use(cookieParser());

app.use('/assets', express.static(path.join(__dirname, '../assets')));

// 📋 Logging
app.use(morgan('dev'));
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(' ')[0],
          url: message.split(' ')[1],
          status: message.split(' ')[2],
          responseTime: message.split(' ')[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  }),
);

// 🩺 Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Ez LabTesting Backend running smoothly.',
  });
});

// 🚀 API Routes
app.use('/api/v1', router);

// ❌ 404 Not Found handler
app.use((req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND!',
    error: {
      path: req.originalUrl,
      message: 'Your requested path is not found!',
    },
  });
});

// 🧯 Global error handler
app.use(GlobalErrorHandler as ErrorRequestHandler);

export default app;
