import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { taskService } from '../services/task.service';
import { mlService } from '../services/ml.service';
import { userService } from '../services/user.service';

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await taskService.createTask(req.body, req.user!.id);
        res.status(201).json(task);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const tasks = await taskService.getTasks(req.user!.id, req.query);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения задач' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await taskService.updateTask(
            Number(req.params.id),
            req.body,
            req.user!.id,
        );
        res.json(task);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        await taskService.deleteTask(Number(req.params.id), req.user!.id);
        res.json({ message: 'Задача удалена' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// 🔥 НОВОЕ: Декомпозиция задачи через ML (Раздел 2.1.3)
export const decomposeTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        // 1. Получаем задачу
        const task = await taskService.getTaskById(Number(id), userId);

        // 2. Получаем профиль пользователя для speed_factor (Раздел 3.3.1)
        const user = await userService.getProfile(userId);

        // 3. Вызываем ML-Core
        const decomposition = await mlService.decomposeTask(
            task.title,
            task.description || '',
            task.categoryId || undefined,
            user?.speedFactor || 1.0,
        );

        // 4. Создаём подзадачи в БД
        const createdSubtasks = [];
        for (const subtask of decomposition.subtasks) {
            const created = await taskService.createTask(
                {
                    title: subtask.title,
                    description: subtask.description,
                    estimatedHours: subtask.estimatedHours,
                    parentId: Number(id),
                    priority: task.priority,
                },
                userId,
            );
            createdSubtasks.push(created);
        }

        res.json({
            message: 'Задача декомпозирована',
            method: decomposition.method,
            confidence: decomposition.confidence,
            subtasks: createdSubtasks,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
