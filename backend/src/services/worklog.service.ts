import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface IWorkLogService {
  createWorkLog(data: any, userId: number): Promise<any>;
  getWorkLogs(userId: number): Promise<any>;
  finetuneUser(userId: number): Promise<any>; // Раздел 3.3.1
}

export class WorkLogService implements IWorkLogService {
  // Создать запись о работе (Раздел 3.2.4)
  async createWorkLog(data: any, userId: number) {
    const workLog = await prisma.workLog.create({
      data: {
        taskId: Number(data.taskId),
        userId,
        hours: Number(data.hours),
        comment: data.comment,
      },
      include: {
        task: true,
      },
    });

    // Обновить actualHours в задаче
    await prisma.task.update({
      where: { id: Number(data.taskId) },
      data: { actualHours: Number(data.hours) },
    });

    return workLog;
  }

  // Получить все WorkLog пользователя
  async getWorkLogs(userId: number) {
    return await prisma.workLog.findMany({
      where: { userId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            estimatedHours: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Self-finetuning: обновить speedFactor (Раздел 3.3.1)
  async finetuneUser(userId: number) {
    // Алгоритм из раздела 3.3.1:
    // k_скорости = mean(t_plan / t_fact)

    const workLogs = await prisma.workLog.findMany({
      where: { userId },
      include: { task: true },
      orderBy: { createdAt: 'desc' },
      take: 20, // N = 20
    });

    // Фильтруем только завершённые задачи с оценками
    const validLogs = workLogs.filter(log =>
      log.task.status === 'DONE' &&
      log.task.estimatedHours !== null &&
      log.task.estimatedHours !== undefined &&
      log.hours > 0
    );

    if (validLogs.length === 0) {
      return {
        message: 'Недостаточно данных для обучения',
        speedFactor: 1.0,
        accuracy: 0.0,
        samplesUsed: 0,
      };
    }

    // Вычисление коэффициента скорости (формула из Раздела 3.3.1)
    const ratios = validLogs.map(log =>
      log.task.estimatedHours! / log.hours
    );
    const newSpeedFactor = ratios.reduce((a, b) => a + b, 0) / ratios.length;

    // Вычисление точности (MAPE)
    const mape = ratios.reduce((acc, r) => acc + Math.abs(1 - r), 0) / ratios.length;
    const accuracy = Math.max(0, Math.min(1, 1 - mape));

    // Обновление профиля пользователя
    await prisma.user.update({
      where: { id: userId },
      data: { speedFactor: newSpeedFactor, accuracy },
    });

    return {
      message: 'Коэффициент скорости обновлён',
      speedFactor: Number(newSpeedFactor.toFixed(3)),
      accuracy: Number(accuracy.toFixed(3)),
      samplesUsed: validLogs.length,
    };
  }
}

export const workLogService = new WorkLogService();