import { PrismaClient, TaskStatus, Priority } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const createTask = async (
  userId: number,
  title: string,
  description?: string,
  priority?: Priority,
  dueDate?: Date
) => {
  // 🔥 Запрос к ML-Core для прогноза времени (Раздел 2.1.5)
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

  const task = await prisma.task.create({
    data: {
      userId,
      title,
      description,
      priority: priority || Priority.MEDIUM,
      estimatedHours,
      dueDate,
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
  data: { title?: string; description?: string; status?: TaskStatus; priority?: Priority }
) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    throw new Error('Task not found');
  }

  return await prisma.task.update({
    where: { id: taskId },
    data,
  });
};

export const deleteTask = async (taskId: number, userId: number) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    throw new Error('Task not found');
  }

  return await prisma.task.delete({ where: { id: taskId } });
};