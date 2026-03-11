import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createTaskController,
  getTasksController,
  updateTaskController,
  deleteTaskController,
} from '../controllers/task.controller';

const router = Router();

router.use(authMiddleware); // Все роуты защищены

router.post('/', createTaskController);
router.get('/', getTasksController);
router.put('/:id', updateTaskController);
router.delete('/:id', deleteTaskController);

export default router;