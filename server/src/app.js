import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import policyProductRoutes from './routes/policyProductRoutes.js';
import customerPolicyRoutes from './routes/customerPolicyRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import ocrRoutes from './routes/ocrRoutes.js';
import surveyRoutes from './routes/surveyRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import ruleRoutes from './routes/ruleRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = () => {
  const app = express();

  // Security HTTP headers with cross-origin resource policy for document uploads
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // CORS
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(cors({
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }));

  // Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static uploads serving (both server/uploads and root uploads)
  const serverUploadDir = path.resolve(__dirname, '../uploads');
  const rootUploadDir = path.resolve(__dirname, '../../uploads');
  app.use('/uploads', express.static(serverUploadDir));
  app.use('/uploads', express.static(rootUploadDir));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      timestamp: new Date(),
      service: 'InsureFlow API Server',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API Route mounting
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/policy-products', policyProductRoutes);
  app.use('/api/customer-policies', customerPolicyRoutes);
  app.use('/api/claims', claimRoutes);
  app.use('/api/ocr', ocrRoutes);
  app.use('/api/survey', surveyRoutes);
  app.use('/api/manager', managerRoutes);
  app.use('/api/settlements', settlementRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/rules', ruleRoutes);
  app.use('/api/audit-logs', auditLogRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Central error handler
  app.use(errorHandler);

  return app;
};
