import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { createTask, getTasks, updateTask, deleteTask, decomposeTask } from '../controllers/task.controller';
import { createWorkLog, getWorkLogs, finetuneUser } from '../controllers/worklog.controller';
import { generateSchedule, acceptSchedule, getStrategies } from '../controllers/schedule.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', authMiddleware, getProfile);

// Tasks
router.post('/tasks', authMiddleware, createTask);
router.get('/tasks', authMiddleware, getTasks);
router.put('/tasks/:id', authMiddleware, updateTask);
router.delete('/tasks/:id', authMiddleware, deleteTask);
router.post('/tasks/:id/decompose', authMiddleware, decomposeTask);

// Schedule
router.post('/tasks/:id/schedule/generate', authMiddleware, generateSchedule);
router.post('/schedule/accept', authMiddleware, acceptSchedule);
router.get('/schedule/strategies', authMiddleware, getStrategies);

// WorkLog + Self-finetuning
router.post('/worklogs', authMiddleware, createWorkLog);
router.get('/worklogs', authMiddleware, getWorkLogs);
router.post('/finetune', authMiddleware, finetuneUser);

export default router;