import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createWorkLogController, getWorkLogsController } from '../controllers/worklog.controller';

const router = Router();
router.use(authMiddleware);

router.post('/', createWorkLogController);
router.get('/', getWorkLogsController);

export default router;