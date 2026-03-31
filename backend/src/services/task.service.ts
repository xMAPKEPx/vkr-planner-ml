import { PrismaClient, TaskStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

export interface ITaskService {
  createTask(data: any, userId: number): Promise<any>;
  getTasks(userId: number, filters?: any): Promise<any>;
  getTaskById(id: number, userId: number): Promise<any>;
  updateTask(id: number, data: any, userId: number): Promise<any>;
  deleteTask(id: number, userId: number): Promise<void>;
}

export class TaskService implements ITaskService {
  // Создать задачу (Раздел 3.2.2)
  async createTask(data: any, userId: number) {
    return await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || Priority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        categoryId: data.categoryId || null,
        parentId: data.parentId || null,
        estimatedHours: data.estimatedHours || null,
        userId,
      },
      include: {
        subtasks: true,
        category: true,
      },
    });
  }

  // Получить все задачи пользователя
  async getTasks(userId: number, filters?: any) {
    return await prisma.task.findMany({
      where: {
        userId,
        status: filters?.status || undefined,
        priority: filters?.priority || undefined,
      },
      include: {
        subtasks: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Получить задачу по ID
  async getTaskById(id: number, userId: number) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: true,
        category: true,
        workLogs: true,
      },
    });

    if (!task || task.userId !== userId) {
      throw new Error('Задача не найдена или нет доступа');
    }

    return task;
  }

  // Обновить задачу (Раздел 3.2.2)
  async updateTask(id: number, data: any, userId: number) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new Error('Нет доступа к задаче');
    }

    return await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus,
        priority: data.priority as Priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : null,
        completedAt: data.status === 'DONE' ? new Date() : existing.completedAt,
      },
    });
  }

  // Удалить задачу
  async deleteTask(id: number, userId: number) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new Error('Нет доступа к задаче');
    }

    await prisma.task.delete({ where: { id } });
  }
}

export const taskService = new TaskService();