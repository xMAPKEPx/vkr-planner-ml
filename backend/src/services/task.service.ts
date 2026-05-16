import { PrismaClient, TaskStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

export interface ITaskService {
    createTask(data: any, userId: number): Promise<any>;
    createTaskWithSubtasks(data: any, userId: number): Promise<any>;
    getTasks(userId: number, filters?: any): Promise<any>;
    getTasksWithSchedule(userId: number, filters?: any): Promise<any>;
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
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                estimatedDuration: data.estimatedDuration || null,
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

    // Создать задачу с подзадачами (для генерированного расписания)
    async createTaskWithSubtasks(data: any, userId: number) {
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority || Priority.MEDIUM,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                estimatedDuration: data.estimatedDuration || null,
                estimatedHours: data.estimatedHours || null,
                categoryId: data.categoryId || null,
                userId,
            },
        });

        // Создать подзадачи если они есть
        if (data.subtasks && Array.isArray(data.subtasks)) {
            await Promise.all(
                data.subtasks.map((sub: any) =>
                    prisma.task.create({
                        data: {
                            title: sub.title,
                            description: sub.description || null,
                            estimatedHours: sub.estimatedHours || null,
                            estimatedDuration: (sub.estimatedHours || 0) * 60,
                            startDate: sub.startDate
                                ? new Date(sub.startDate)
                                : null,
                            endDate: sub.endDate ? new Date(sub.endDate) : null,
                            parentId: task.id,
                            userId,
                            priority: Priority.MEDIUM,
                        },
                    }),
                ),
            );
        }

        return this.getTaskById(task.id, userId);
    }

    // Получить все задачи пользователя
    async getTasks(userId: number, filters?: any) {
        return await prisma.task.findMany({
            where: {
                userId,
                parentId: null, // Только основные задачи, не подзадачи
                status: filters?.status || undefined,
                priority: filters?.priority || undefined,
            },
            include: {
                subtasks: {
                    orderBy: [{ createdAt: 'asc' }], // 👈 Массив для консистентности
                },
                category: true,
            },
            // 👇 ИСПРАВЛЕНО: массив объектов для сортировки по нескольким полям
            orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
        });
    }

    // Получить все задачи пользователя с расписанием (для календаря)
    async getTasksWithSchedule(userId: number, filters?: any) {
        console.log('🔍 Поиск задач:', {
            userId,
            filters,
            startDate: filters?.startDate
                ? new Date(filters.startDate)
                : 'undefined',
            endDate: filters?.endDate ? new Date(filters.endDate) : 'undefined',
        });

        const whereClause: any = {
            userId,
            parentId: null,
        };

        // 🔥 Добавляем фильтрацию по датам ТОЛЬКО если они переданы
        if (filters?.startDate || filters?.endDate) {
            whereClause.OR = [];

            if (filters.startDate) {
                whereClause.OR.push({
                    startDate: { gte: new Date(filters.startDate) },
                });
            }

            if (filters.endDate) {
                whereClause.OR.push({
                    endDate: { lte: new Date(filters.endDate) },
                });
            }

            // 🔥 Также задачи, которые пересекаются с диапазоном
            whereClause.OR.push({
                AND: [
                    { startDate: { lte: new Date(filters.endDate) } },
                    { endDate: { gte: new Date(filters.startDate) } },
                ],
            });
        }

        console.log('📋 Where clause:', JSON.stringify(whereClause, null, 2));

        return await prisma.task.findMany({
            where: whereClause,
            include: {
                subtasks: {
                    orderBy: [{ createdAt: 'asc' }],
                },
                category: true,
            },
            orderBy: [{ startDate: 'asc' }],
        });
    }

    // Получить задачу по ID
    async getTaskById(id: number, userId: number) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                subtasks: {
                    orderBy: [{ createdAt: 'asc' }], // 👈 Массив
                },
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
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                estimatedDuration: data.estimatedDuration || null,
                estimatedHours: data.estimatedHours
                    ? Number(data.estimatedHours)
                    : null,
                completedAt:
                    data.status === 'DONE' ? new Date() : existing.completedAt,
            },
        });
    }

    // Удалить задачу
    async deleteTask(id: number, userId: number) {
        const existing = await prisma.task.findUnique({
            where: { id },
            include: { subtasks: true },
        });
        if (!existing || existing.userId !== userId) {
            throw new Error('Нет доступа к задаче');
        }

        // Удалить подзадачи
        if (existing.subtasks.length > 0) {
            await prisma.task.deleteMany({
                where: { parentId: id },
            });
        }

        await prisma.task.delete({ where: { id } });
    }
}

export const taskService = new TaskService();
