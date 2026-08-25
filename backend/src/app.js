import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import usersRoutes from './routes/users.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import skillsRoutes from './routes/skills.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import lessonsRoutes from './routes/lessons.routes.js';
import enrollmentsRoutes from './routes/enrollments.routes.js';
import journeysRoutes from './routes/journeys.routes.js';
import learningPathRoutes from './routes/learningPath.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import assessmentsRoutes from './routes/assessments.routes.js';
import progressRoutes from './routes/progress.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import searchRoutes from './routes/search.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
  app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/goals', goalsRoutes);
  app.use('/api/skills', skillsRoutes);
  app.use('/api/courses', coursesRoutes);
  app.use('/api/lessons', lessonsRoutes);
  app.use('/api/enrollments', enrollmentsRoutes);
  app.use('/api/journeys', journeysRoutes);
  app.use('/api/learning-path', learningPathRoutes);
  app.use('/api/projects', projectsRoutes);
  app.use('/api/assessments', assessmentsRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
