import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { workLogService } from '../services/worklog.service';

export const createWorkLog = async (req: AuthRequest, res: Response) => {
  try {
    const workLog = await workLogService.createWorkLog(req.body, req.user!.id);
    res.status(201).json(workLog);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getWorkLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await workLogService.getWorkLogs(req.user!.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
};

export const finetuneUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await workLogService.finetuneUser(req.user!.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка self-finetuning' });
  }
};