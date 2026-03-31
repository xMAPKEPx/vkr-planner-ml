import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { taskService } from '../services/task.service';
import { scheduleService } from '../services/schedule.service';
import { userService } from '../services/user.service';

// Генерация вариантов расписания для задачи (Раздел 2.1.5)
export const generateSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { dueDate, startDate } = req.body;
    const userId = req.user!.id;

    // 1. Получаем задачу с подзадачами
    const task = await taskService.getTaskById(Number(id), userId);
    
    if (!task.subtasks || task.subtasks.length === 0) {
      return res.status(400).json({ 
        error: 'Сначала декомпозируйте задачу на подзадачи' 
      });
    }

    // 2. Получаем профиль пользователя для speed_factor
    const user = await userService.getProfile(userId);

    // 3. Генерируем варианты расписаний
    const result = await scheduleService.generateScheduleVariants(
      task.subtasks,
      userId,
      dueDate || task.dueDate!,
      user?.speedFactor || 1.0,
      startDate
    );

    res.json({
      taskId: id,
      taskTitle: task.title,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Принять вариант расписания (сохранить в БД)
export const acceptSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { variantId, slots } = req.body;
    const userId = req.user!.id;

    // TODO: Сохранить слоты расписания в БД (таблица Schedule или Task.dueDate)
    // Для ВКР можно обновить dueDate у подзадач

    res.json({
      message: 'Расписание принято',
      variantId,
      slotsCount: slots.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Получить доступные стратегии планирования
export const getStrategies = async (req: AuthRequest, res: Response) => {
  try {
    const strategies = await scheduleService.getStrategies();
    res.json(strategies);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения стратегий' });
  }
};