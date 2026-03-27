import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as taskService from '../services/task.service';

export const createTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    const task = await taskService.createTask(req.userId!, title, description, priority, dueDate);
    res.status(201).json(task);
  } catch (error: any) {
    next(error);
  }
};

export const getTasksController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await taskService.getTasks(req.userId!);
    res.json(tasks);
  } catch (error: any) {
    next(error);
  }
};

export const updateTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const task = await taskService.updateTask(Number(id), req.userId!, req.body);
    res.json(task);
  } catch (error: any) {
    next(error);
  }
};

export const deleteTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await taskService.deleteTask(Number(id), req.userId!);
    res.status(204).send();
  } catch (error: any) {
    next(error);
  }
};

export const getTasksByDateRangeController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates required' });
    }
    const tasks = await taskService.getTasksByDateRange(
      req.userId!,
      start as string,
      end as string
    );
    res.json(tasks);
  } catch (error: any) {
    next(error);
  }
};