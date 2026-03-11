import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as worklogService from '../services/worklog.service';

export const createWorkLogController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId, hours, comment } = req.body;
    const workLog = await worklogService.createWorkLog(req.userId!, taskId, hours, comment);
    res.status(201).json(workLog);
  } catch (error: any) {
    next(error);
  }
};

export const getWorkLogsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workLogs = await worklogService.getWorkLogs(req.userId!);
    res.json(workLogs);
  } catch (error: any) {
    next(error);
  }
};