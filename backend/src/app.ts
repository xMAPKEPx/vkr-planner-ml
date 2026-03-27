import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Импорты роутов
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import worklogRoutes from './routes/worklog.routes';

const app = express();
export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`📍 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// DB test
app.get('/api/db-test', async (req: Request, res: Response) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', message: 'Database connected!' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// 🔥 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/worklogs', worklogRoutes);

// Test route
app.post('/api/auth/test', (req: Request, res: Response) => {
  console.log('✅ Test route hit!');
  res.json({ message: 'Auth routes are working!', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  console.log(`⚠️ 404: ${req.method} ${req.path}`);
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

export default app;