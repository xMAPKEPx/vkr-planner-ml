import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const createWorkLog = async (
  userId: number,
  taskId: number,
  hours: number,
  comment?: string
) => {
  const workLog = await prisma.workLog.create({
    data: { userId, taskId, hours, comment },
  });

  // 🔥 Отправка обратной связи в ML-Core (Раздел 2.1.6)
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (task && task.estimatedHours) {
      await axios.post(`${ML_API_URL}/feedback`, {
        task_id: taskId,
        actual_hours: hours,
        estimated_hours: task.estimatedHours,
      });
    }
  } catch (error) {
    console.log('Failed to send feedback to ML-Core');
  }

  // 🔥 Пересчёт speed_factor пользователя (Раздел 3.3.1)
  await recalculateUserSpeed(userId);

  return workLog;
};

const recalculateUserSpeed = async (userId: number) => {
  const workLogs = await prisma.workLog.findMany({
    where: { userId },
    include: { task: true },
    take: 20, // Последние 20 задач
  });

  if (workLogs.length === 0) return;

  const ratios = workLogs
    .filter(log => log.task.estimatedHours && log.task.estimatedHours! > 0)
    .map(log => log.hours / log.task.estimatedHours!);

  if (ratios.length === 0) return;

  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const speedFactor = 1 / avgRatio;

  await prisma.user.update({
    where: { id: userId },
    data: { speedFactor },
  });
};

export const getWorkLogs = async (userId: number) => {
  return await prisma.workLog.findMany({
    where: { userId },
    include: { task: true },
    orderBy: { createdAt: 'desc' },
  });
};