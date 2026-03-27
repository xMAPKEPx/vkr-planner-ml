// backend/src/services/task.service.ts
import { PrismaClient, TaskStatus, Priority } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// 🔥 Вспомогательная функция для парсинга даты
const parseDueDate = (dueDate?: string | Date): Date | undefined => {
  if (!dueDate) return undefined;
  
  // Если уже Date объект — возвращаем как есть
  if (dueDate instanceof Date) return dueDate;
  
  // Если строка в формате "YYYY-MM-DD" — добавляем время
  if (typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return new Date(`${dueDate}T00:00:00.000Z`);
  }
  
  // Иначе пытаемся распарсить как есть
  const parsed = new Date(dueDate);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

export const createTask = async (
  userId: number,
  title: string,
  description?: string,
  priority?: Priority,
  dueDate?: string | Date
) => {
  // 🔥 Запрос к ML-Core для прогноза времени
  let estimatedHours: number | undefined;
  try {
    const mlResponse = await axios.post(`${ML_API_URL}/predict`, {
      title,
      description,
      priority: priority || 'MEDIUM',
    });
    estimatedHours = mlResponse.data.predicted_hours;
  } catch (error) {
    console.log('ML prediction failed, using manual estimate');
  }

  // 🔥 Парсим dueDate в правильный формат
  const dueDateObj = parseDueDate(dueDate);

  const task = await prisma.task.create({
    data: {
      userId,
      title,
      description,
      priority: priority || Priority.MEDIUM,
      estimatedHours,
      dueDate: dueDateObj,  // ✅ Передаём Date объект или undefined
      status: TaskStatus.TODO,
    },
  });

  return task;
};

export const getTasks = async (userId: number) => {
  return await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateTask = async (
  taskId: number,
  userId: number,
  data: { title?: string; description?: string; status?: TaskStatus; priority?: Priority; dueDate?: string | Date }
) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    throw new Error('Task not found');
  }

  // Парсим dueDate если он есть в данных для обновления
  const updateData: any = { ...data };
  if (data.dueDate) {
    updateData.dueDate = parseDueDate(data.dueDate);
  }

  return await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });
};

export const deleteTask = async (taskId: number, userId: number) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    throw new Error('Task not found');
  }

  return await prisma.task.delete({ where: { id: taskId } });
};

export const getTasksByDateRange = async (
  userId: number,
  start: string,
  end: string
) => {
  return await prisma.task.findMany({
    where: {
      userId,
      dueDate: {
        gte: new Date(start),
        lte: new Date(end),
      },
    },
    orderBy: { dueDate: 'asc' },
  });
};