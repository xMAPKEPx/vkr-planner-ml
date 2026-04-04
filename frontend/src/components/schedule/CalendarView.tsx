// src/components/schedule/CalendarView.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTasks, createTask, updateTask } from '@/store/slices/taskSlice';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, Subtask } from '@/types';
import CreateTaskModal from '../tasks/CreateTaskModal';
import CompleteTaskModal from '../tasks/CompleteTaskModal';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const SLOT_HEIGHT = 60; // Высота одного часа в пикселях

export default function CalendarView() {
    const dispatch = useAppDispatch();

    const { tasks, loading, error, userSpeedFactor, lastMape } = useAppSelector(
        (state) => state.tasks,
    );

    // Состояния для модалок
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(new Date(2026, 3, 4));
    const [selectedTask, setSelectedTaskLocal] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Drag-and-Drop state
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    // Загружаем задачи при монтировании
    useEffect(() => {
        dispatch(fetchTasks());
    }, [dispatch]);

    // === Навигация ===
    const handlePrevWeek = () => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() - 7);
        setCurrentWeek(newWeek);
    };

    const handleNextWeek = () => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() + 7);
        setCurrentWeek(newWeek);
    };

    const handleToday = () => setCurrentWeek(new Date());

    const getWeekDays = () => {
        const startOfWeek = new Date(currentWeek);
        const day = startOfWeek.getDay();
        // Корректировка, чтобы неделя начиналась с ПН
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            return date;
        });
    };

    const weekDays = getWeekDays();

    // === Обработчики задач ===
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreateTask = (taskData: any) => {
        let duration = 60;
        if (taskData.startDate && taskData.endDate) {
            duration =
                (new Date(taskData.endDate).getTime() -
                    new Date(taskData.startDate).getTime()) /
                60000;
        }

        const newTaskData: Partial<Task> = {
            title: taskData.title,
            description: taskData.description || '',
            estimatedDuration: duration,
            startDate: new Date(taskData.startDate).toISOString(),
            endDate: new Date(taskData.endDate).toISOString(),
            userId: 'user-1',
            category: taskData.category || 'general',
            assignee: taskData.assignee,
            status: 'todo',
        };

        dispatch(createTask(newTaskData));
        setIsCreateModalOpen(false);
    };

    const handleTaskClick = (task: Task) => {
        if (task.status !== 'done') {
            setEditingTask(task);
            setIsCreateModalOpen(true);
        }
    };

    const handleTaskContextMenu = (e: React.MouseEvent, task: Task) => {
        e.preventDefault();
        if (task.status !== 'done') {
            setSelectedTaskLocal(task);
            setIsCompleteModalOpen(true);
        }
    };

    // === Drag-and-Drop ===
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            if (e.target instanceof HTMLElement) {
                e.target.style.opacity = '0.5';
            }
        }, 0);
    };

    const handleDrop = (e: React.DragEvent, dayIndex: number, hour: number) => {
        e.preventDefault();
        if (!draggedTask || !draggedTask.startDate || !draggedTask.endDate)
            return;

        const oldStart = new Date(draggedTask.startDate);
        const oldEnd = new Date(draggedTask.endDate);
        const durationMs = oldEnd.getTime() - oldStart.getTime();

        const weekStart = weekDays[0];
        const newDate = new Date(weekStart);
        newDate.setDate(weekStart.getDate() + dayIndex);
        newDate.setHours(hour, 0, 0, 0);

        const newEnd = new Date(newDate.getTime() + durationMs);

        dispatch(
            updateTask({
                taskId: draggedTask.id,
                updates: {
                    startDate: newDate.toISOString(),
                    endDate: newEnd.toISOString(),
                },
            }),
        );
        setDraggedTask(null);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = '1';
        }
        setDraggedTask(null);
    };

    // === Вспомогательные функции ===
    const getTaskColor = (task: Task) => {
        if (task.status === 'done') return 'bg-gray-400 opacity-60';
        if (task.status === 'in_progress') return 'bg-blue-500';
        return 'bg-purple-500';
    };

    // Фильтр задач для текущей недели
    // Фильтр задач: показываем задачи, которые ПЕРЕСЕКАЮТСЯ с текущей неделей
    const weekTasks = tasks.filter((task) => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const weekStart = new Date(weekDays[0]);
        const weekEnd = new Date(weekDays[6]);
        weekEnd.setHours(23, 59, 59, 999);

        // Задача пересекается с неделей, если:
        // (начало задачи <= конец недели) И (конец задачи >= начало недели)
        return taskStart <= weekEnd && taskEnd >= weekStart;
    });

    // === Рендеринг сегмента задачи для конкретного дня ===
    const renderTaskSegment = (
        task: Task,
        dayDate: Date,
        dayIndex: number,
        segmentIndex: number,
        totalSegments: number,
    ) => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);

        // Определяем границы сегмента для этого дня
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Начало сегмента: либо старт задачи, либо начало дня
        const segmentStart = taskStart > dayStart ? taskStart : dayStart;
        // Конец сегмента: либо конец задачи, либо конец дня
        const segmentEnd = taskEnd < dayEnd ? taskEnd : dayEnd;

        // Расчет позиции
        const startHour = segmentStart.getHours();
        const startMinutes = segmentStart.getMinutes();
        const durationHours =
            (segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 60 * 60);

        const topPx = (startHour + startMinutes / 60) * SLOT_HEIGHT;
        const heightPx = Math.max(durationHours * SLOT_HEIGHT, 24); // Мин. высота для видимости

        // Скругление углов для визуальной целостности
        const isFirst = segmentIndex === 0;
        const isLast = segmentIndex === totalSegments - 1;

        return (
            <div
                key={`${task.id}-${dayDate.toDateString()}`}
                draggable={task.status !== 'done' && isFirst}
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                onClick={() => handleTaskClick(task)}
                onContextMenu={(e) => handleTaskContextMenu(e, task)}
                className={`absolute ${getTaskColor(task)} text-white p-2 rounded-md text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm group z-10 ${
                    task.status === 'done'
                        ? 'cursor-not-allowed opacity-60'
                        : ''
                }`}
                style={{
                    left: `calc(${(dayIndex / 7) * 100}% + 4px)`,
                    top: `${topPx}px`,
                    width: `calc(${100 / 7}% - 8px)`,
                    height: `${heightPx}px`,
                    borderTopLeftRadius: isFirst ? '0.375rem' : '0',
                    borderTopRightRadius: isFirst ? '0.375rem' : '0',
                    borderBottomLeftRadius: isLast ? '0.375rem' : '0',
                    borderBottomRightRadius: isLast ? '0.375rem' : '0',
                }}
            >
                {/* Заголовок показываем только в первом сегменте */}
                {isFirst && (
                    <div className='font-semibold truncate flex items-center gap-1'>
                        {task.title}
                    </div>
                )}

                {/* Время показываем в первом и последнем сегменте */}
                {(isFirst || isLast) && (
                    <div className='opacity-90 flex items-center gap-1 mt-0.5 text-[10px]'>
                        <Clock className='w-3 h-3' />
                        {segmentStart.getHours().toString().padStart(2, '0')}:
                        {segmentStart.getMinutes().toString().padStart(2, '0')}
                        {totalSegments > 1 && (isFirst ? '-...' : '...-')}
                        {segmentEnd.getHours().toString().padStart(2, '0')}:
                        {segmentEnd.getMinutes().toString().padStart(2, '0')}
                    </div>
                )}

                {/* Якорь на подзадачи */}
                {isFirst && task.subtasks && task.subtasks.length > 0 && (
                    <div className='text-[10px] opacity-75 mt-1 flex items-center gap-1'>
                        <CheckCircle className='w-3 h-3' />
                        {task.subtasks.length} подзадач
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className='flex flex-col h-full bg-white dark:bg-gray-950'>
            {/* Toolbar */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800'>
                <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-1'>
                        <Button
                            variant='outline'
                            size='icon'
                            onClick={handlePrevWeek}
                        >
                            <ChevronLeft className='w-5 h-5' />
                        </Button>
                        <Button
                            variant='outline'
                            size='icon'
                            onClick={handleNextWeek}
                        >
                            <ChevronRight className='w-5 h-5' />
                        </Button>
                    </div>
                    <Button
                        variant='outline'
                        onClick={handleToday}
                        className='text-sm'
                    >
                        Сегодня
                    </Button>
                    <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                        {weekDays[0].toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                        })}{' '}
                        –{' '}
                        {weekDays[6].toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </h2>
                </div>

                {/* Метрики Self-finetuning */}
                {lastMape !== null && (
                    <div className='hidden md:flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-lg border border-green-200'>
                        <CheckCircle className='w-4 h-4 text-green-600' />
                        <span className='font-medium'>Система обучается:</span>
                        <span>Точность {(100 - lastMape).toFixed(1)}%</span>
                        <span className='text-green-800 font-bold'>
                            (k={userSpeedFactor.toFixed(2)})
                        </span>
                    </div>
                )}

                <Button
                    onClick={() => {
                        setEditingTask(null);
                        setIsCreateModalOpen(true);
                    }}
                    className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700'
                >
                    <Plus className='w-5 h-5' />
                    Создать задачу
                </Button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 flex items-center gap-2'>
                    <AlertCircle className='w-5 h-5' />
                    <p>{error}</p>
                </div>
            )}

            {/* Основной контент: Календарь + Сайдбар */}
            <div className='flex-1 overflow-hidden flex'>
                {/* Область календаря */}
                <div className='flex-1 overflow-auto relative'>
                    <div className='flex min-w-250'>
                        {/* Колонка времени */}
                        <div className='w-16 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky left-0 z-20'>
                            <div className='h-12 border-b border-gray-200 dark:border-gray-800' />
                            {HOURS.map((hour) => (
                                <div
                                    key={hour}
                                    className='h-15 text-[10px] text-gray-500 dark:text-gray-400 text-right pr-2 pt-1'
                                >
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {/* Сетка дней */}
                        <div className='flex-1'>
                            {/* Шапка дней */}
                            <div className='grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 bg-white dark:bg-gray-950'>
                                {weekDays.map((day, index) => {
                                    const isToday =
                                        new Date().toDateString() ===
                                        day.toDateString();
                                    return (
                                        <div
                                            key={index}
                                            className={`h-12 flex flex-col items-center justify-center border-l border-gray-200 dark:border-gray-800 ${
                                                isToday
                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                    : ''
                                            }`}
                                        >
                                            <span className='text-xs text-gray-500 dark:text-gray-400'>
                                                {DAYS[index]}
                                            </span>
                                            <span
                                                className={`text-lg font-semibold ${
                                                    isToday
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-gray-900 dark:text-gray-100'
                                                }`}
                                            >
                                                {day.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Слоты и Задачи */}
                            <div
                                className='grid grid-cols-7 relative'
                                onDragOver={(e) => e.preventDefault()}
                            >
                                {/* Фон (сетка) */}
                                {weekDays.map((_, dayIndex) => (
                                    <div
                                        key={dayIndex}
                                        className='border-l border-gray-200 dark:border-gray-800'
                                    >
                                        {HOURS.map((hour) => (
                                            <div
                                                key={hour}
                                                className='h-15 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors'
                                                data-day={dayIndex}
                                                data-hour={hour}
                                                onDragOver={(e) =>
                                                    e.preventDefault()
                                                }
                                                onDrop={(e) =>
                                                    handleDrop(
                                                        e,
                                                        dayIndex,
                                                        hour,
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                ))}

                                {/* Задачи (Overlay) */}
                                {loading ? (
                                    <div className='absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 z-20'>
                                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' />
                                    </div>
                                ) : (
                                    weekTasks.map((task) => {
                                        const taskStart = new Date(
                                            task.startDate,
                                        );
                                        const taskEnd = new Date(task.endDate);

                                        // Генерируем массив дней, которые покрывает задача
                                        const daysInRange: Date[] = [];
                                        const current = new Date(taskStart);
                                        current.setHours(0, 0, 0, 0);
                                        const end = new Date(taskEnd);
                                        end.setHours(0, 0, 0, 0);

                                        while (current <= end) {
                                            daysInRange.push(new Date(current));
                                            current.setDate(
                                                current.getDate() + 1,
                                            );
                                        }

                                        // Рендерим сегмент для каждого дня из диапазона
                                        return daysInRange
                                            .map((dayDate, segmentIndex) => {
                                                // Проверяем, что день входит в текущую видимую неделю
                                                const isDayInView =
                                                    weekDays.some(
                                                        (d) =>
                                                            d.toDateString() ===
                                                            dayDate.toDateString(),
                                                    );
                                                if (!isDayInView) return null;

                                                // Вычисляем индекс колонки (0-6)
                                                let dayIndex =
                                                    dayDate.getDay() - 1;
                                                if (dayIndex === -1)
                                                    dayIndex = 6;

                                                return renderTaskSegment(
                                                    task,
                                                    dayDate,
                                                    dayIndex,
                                                    segmentIndex,
                                                    daysInRange.length,
                                                );
                                            })
                                            .filter(Boolean);
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ Сайдбар подзадач (справа) */}
                <div className='w-80 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col z-30 shadow-xl'>
                    <div className='p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'>
                        <h3 className='text-sm font-bold uppercase text-gray-500 tracking-wider'>
                            Подзадачи недели
                        </h3>
                    </div>

                    <div className='flex-1 overflow-y-auto p-4 space-y-3'>
                        {weekTasks.length === 0 ? (
                            <div className='text-center text-gray-400 text-sm mt-10'>
                                Нет активных задач
                            </div>
                        ) : (
                            weekTasks.flatMap(
                                (task) =>
                                    task.subtasks?.map((subtask: Subtask) => (
                                        <div
                                            key={subtask.id}
                                            className='group p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors shadow-sm'
                                        >
                                            <div className='flex items-start justify-between gap-2'>
                                                <div className='flex-1 min-w-0'>
                                                    <div className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                                                        {subtask.title}
                                                    </div>
                                                    {/* Якорь на родителя */}
                                                    <div
                                                        className='text-xs text-gray-500 mt-1 truncate cursor-pointer hover:text-blue-600 flex items-center gap-1'
                                                        onClick={() =>
                                                            handleTaskClick(
                                                                task,
                                                            )
                                                        }
                                                    >
                                                        ← {task.title}
                                                    </div>
                                                    <div className='text-[10px] text-gray-400 mt-1 flex items-center gap-1'>
                                                        <Clock className='w-3 h-3' />
                                                        {Math.round(
                                                            subtask.estimatedDuration /
                                                                60,
                                                        )}{' '}
                                                        ч
                                                    </div>
                                                </div>
                                                <div
                                                    className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
                                                        subtask.status ===
                                                        'done'
                                                            ? 'bg-green-500'
                                                            : 'bg-blue-500'
                                                    }`}
                                                    title={
                                                        subtask.status ===
                                                        'done'
                                                            ? 'Выполнено'
                                                            : 'В работе'
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )) || [],
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Модалки */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingTask(null);
                }}
                task={editingTask}
                onSubmit={handleCreateTask}
            />
            <CompleteTaskModal
                task={selectedTask}
                isOpen={isCompleteModalOpen}
                onClose={() => {
                    setIsCompleteModalOpen(false);
                    setSelectedTaskLocal(null);
                }}
            />
        </div>
    );
}

// Разработать модуль аутентификации через OAuth2 с поддержкой входа через Google и GitHub. Нужно настроить JWT-токены, добавить rate-limiting и написать unit-тесты. Дедлайн жёсткий — до пятницы.
