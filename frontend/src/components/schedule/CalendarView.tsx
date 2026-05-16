// src/components/schedule/CalendarView.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateTask, fetchTasksForCalendar, generateSchedule, saveTaskWithSchedule } from '@/store/slices/taskSlice';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';
import CreateTaskModal from '../tasks/CreateTaskModal';
import CompleteTaskModal from '../tasks/CompleteTaskModal';

// 🔥 Локальный тип для задач с поддержкой parentId (как в БД)
interface CalendarTask extends Task {
    parentId?: number | null;
    subtasks?: CalendarTask[];
}

// 🔥 Типы для превью и вариантов расписания
interface PreviewTask extends Task {
    isPreview: boolean;
}

interface ScheduleSlot {
    taskTitle: string;
    startTime: string;
    endTime: string;
    date: string;
    estimatedHours: number;
}

interface ScheduleMetrics {
    totalDays: number;
    avgLoadPerDay: number;
    riskScore: number;
    completionDate: string;
}

interface ScheduleVariant {
    id: string;
    name: string;
    description: string;
    slots: ScheduleSlot[];
    metrics: ScheduleMetrics;
    confidence: number;
}

interface GenerateScheduleResult {
    variants: ScheduleVariant[];
    recommendedVariantId: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const SLOT_HEIGHT = 60;

export default function CalendarView() {
    const dispatch = useAppDispatch();
    const { tasks, loading, error, userSpeedFactor, lastMape } = useAppSelector(
        (state) => state.tasks,
    );

    // 🔥 Превью-режим
    const [previewMode, setPreviewMode] = useState(false);
    const [previewTasks, setPreviewTasks] = useState<PreviewTask[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ScheduleVariant | null>(null);
    const [availableVariants, setAvailableVariants] = useState<ScheduleVariant[]>([]);

    // 🔥 Состояния модалок
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [selectedTask, setSelectedTaskLocal] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // 🔥 Данные для сохранения превью
    const [pendingTaskData, setPendingTaskData] = useState<{
        title: string;
        description: string;
        categoryId?: number | null;
        dueDate?: string;
    } | null>(null);

    // 🔥 Подсветка при наведении — 🔥 ИСПРАВЛЕНО: number | null
    const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);

    // Drag-and-Drop
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    // Загрузка задач при монтировании / смене недели
    useEffect(() => {
        const weekStart = new Date(currentWeek);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        dispatch(
            fetchTasksForCalendar({
                startDate: weekStart.toISOString(),
                endDate: weekEnd.toISOString(),
            })
        );
    }, [dispatch, currentWeek]);

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
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            return date;
        });
    };

    const weekDays = getWeekDays();

    // === Данные для рендеринга ===
    
    // 1. Основные задачи (для правой панели) — только главные задачи (без parentId)
    const weekTasks = tasks.filter((task) => {
        const t = task as CalendarTask;
        if (t.parentId) return false;
        
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const weekStart = new Date(weekDays[0]);
        const weekEnd = new Date(weekDays[6]);
        weekEnd.setHours(23, 59, 59, 999);
        return taskStart <= weekEnd && taskEnd >= weekStart;
    });

    // 🔥 2. Элементы для календаря (Подзадачи ИЛИ Сами задачи, если подзадач нет)
    const calendarItems = weekTasks.reduce<CalendarTask[]>((acc, task) => {
        const t = task as CalendarTask;
        
        if (t.subtasks && t.subtasks.length > 0) {
            const validSubtasks = t.subtasks.filter(
                (sub): sub is CalendarTask => 
                    !!(sub as CalendarTask).startDate && !!(sub as CalendarTask).endDate
            );
            acc.push(...validSubtasks);
        } else if (t.startDate && t.endDate) {
            acc.push(t);
        }
        return acc;
    }, []);

    // 3. Итоговый список для календаря (учитываем превью-режим)
    const allCalendarItems = previewMode ? previewTasks : calendarItems;

    // === Обработчики задач ===
    const handleCreateTask = async (taskData: Partial<Task> & {
        categoryId?: number | null;
        variants?: ScheduleVariant[];
        recommendedVariantId?: string;
    }) => {
        if (!taskData.title || !taskData.endDate) {
            console.error('Missing required fields:', taskData);
            return;
        }

        try {
            let result: GenerateScheduleResult;

            if (taskData.variants && taskData.recommendedVariantId) {
                result = {
                    variants: taskData.variants,
                    recommendedVariantId: taskData.recommendedVariantId,
                };
            } else {
                result = (await dispatch(
                    generateSchedule({
                        title: taskData.title,
                        description: taskData.description || '',
                        subtasks: taskData.subtasks || [],
                        dueDate: new Date(taskData.endDate).toISOString().split('T')[0],
                        onlyWeekdays: false,
                    })
                ).unwrap()) as GenerateScheduleResult;
            }

            const recommendedVariant = result.variants.find(
                (v) => v.id === result.recommendedVariantId
            ) || result.variants[0];

            setPendingTaskData({
                title: taskData.title,
                description: taskData.description || '',
                categoryId: taskData.categoryId ?? undefined,
                dueDate: new Date(taskData.endDate).toISOString().split('T')[0],
            });

            setAvailableVariants(result.variants);
            updatePreviewFromVariant(recommendedVariant);

            setSelectedVariant(recommendedVariant);
            setPreviewMode(true);
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error('Ошибка генерации расписания:', err);
        }
    };

    const updatePreviewFromVariant = (variant: ScheduleVariant) => {
        const tasksForPreview: PreviewTask[] = variant.slots.map((slot, idx) => ({
            // 🔥 Отрицательный number для превью, чтобы не конфликтовал с БД
            id: -Date.now() - idx,
            title: slot.taskTitle,
            description: '',
            startDate: new Date(`${slot.date}T${slot.startTime}`).toISOString(),
            endDate: new Date(`${slot.date}T${slot.endTime}`).toISOString(),
            estimatedDuration: Math.round(slot.estimatedHours * 60),
            status: 'todo',
            userId: 1, // 🔥 number вместо 'user-1'
            category: 'general',
            isPreview: true,
            subtasks: [],
        }));
        setPreviewTasks(tasksForPreview);
    };

    const handleVariantChange = (variantId: string) => {
        const variant = availableVariants.find((v) => v.id === variantId);
        if (variant) {
            setSelectedVariant(variant);
            updatePreviewFromVariant(variant);
        }
    };

    const handleSavePreview = async () => {
        if (!selectedVariant || !pendingTaskData) return;

        try {
            const subtasks = selectedVariant.slots.map((slot) => ({
                title: slot.taskTitle,
                estimatedHours: slot.estimatedHours,
                startDate: new Date(`${slot.date}T${slot.startTime}`).toISOString(),
                endDate: new Date(`${slot.date}T${slot.endTime}`).toISOString(),
            }));

            const weekStart = new Date(currentWeek);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            await dispatch(
                saveTaskWithSchedule({
                    title: pendingTaskData.title,
                    description: pendingTaskData.description,
                    categoryId: pendingTaskData.categoryId ?? undefined,
                    subtasks,
                    dueDate: pendingTaskData.dueDate || '',
                    startDate: subtasks[0]?.startDate,
                    endDate: subtasks[subtasks.length - 1]?.endDate,
                })
            );

            setPreviewMode(false);
            setPreviewTasks([]);
            setPendingTaskData(null);
            setSelectedVariant(null);
            setAvailableVariants([]);

            dispatch(
                fetchTasksForCalendar({
                    startDate: weekStart.toISOString(),
                    endDate: weekEnd.toISOString(),
                })
            );
        } catch (err) {
            console.error('Ошибка сохранения:', err);
        }
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
        if (!draggedTask || !draggedTask.startDate || !draggedTask.endDate) return;

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
                // 🔥 draggedTask.id уже number
                taskId: draggedTask.id,
                updates: {
                    startDate: newDate.toISOString(),
                    endDate: newEnd.toISOString(),
                },
            })
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
    const getTaskColor = (task: Task & { isPreview?: boolean }) => {
        if (task.isPreview) return 'bg-blue-500 opacity-40 hover:opacity-60 border-2 border-dashed border-blue-300';
        if (task.status === 'done') return 'bg-gray-400 opacity-60';
        if (task.status === 'in_progress') return 'bg-blue-500';
        return 'bg-purple-500';
    };

    const getRiskBadgeColor = (riskScore: number) => {
        if (riskScore < 0.3) return 'bg-green-100 text-green-800';
        if (riskScore < 0.6) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    // === Рендеринг сегмента задачи ===
    const renderTaskSegment = (
        task: Task & { isPreview?: boolean },
        dayDate: Date,
        dayIndex: number,
        segmentIndex: number,
        totalSegments: number,
    ) => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);

        const segmentStart = taskStart > dayStart ? taskStart : dayStart;
        const segmentEnd = taskEnd < dayEnd ? taskEnd : dayEnd;

        const startHour = segmentStart.getHours();
        const startMinutes = segmentStart.getMinutes();
        const durationHours = (segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 60 * 60);

        const topPx = (startHour + startMinutes / 60) * SLOT_HEIGHT;
        const heightPx = Math.max(durationHours * SLOT_HEIGHT, 24);

        const isFirst = segmentIndex === 0;
        const isLast = segmentIndex === totalSegments - 1;

        // 🔥 Определяем целевой ID для подсветки (оба number)
        const taskWithParent = task as CalendarTask;
        const targetId = taskWithParent.parentId ?? task.id;
        const isHighlighted = highlightedTaskId !== null && targetId === highlightedTaskId;

        return (
            <div
                key={`${task.id}-${dayDate.toDateString()}`}
                draggable={task.status !== 'done' && isFirst}
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                onClick={() => handleTaskClick(task)}
                onContextMenu={(e) => handleTaskContextMenu(e, task)}
                onMouseEnter={() => setHighlightedTaskId(targetId)}
                onMouseLeave={() => setHighlightedTaskId(null)}
                className={`absolute ${getTaskColor(task)} text-white p-2 rounded-md text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-all shadow-sm group z-10 ${
                    task.status === 'done' ? 'cursor-not-allowed opacity-60' : ''
                } ${isHighlighted ? 'ring-2 ring-yellow-400 shadow-lg z-20 scale-[1.02]' : ''}`}
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
                {isFirst && (
                    <div className='font-semibold truncate flex items-center gap-1'>
                        {task.title}
                        {task.isPreview && (
                            <span className='text-[9px] bg-blue-200 text-blue-800 px-1 rounded ml-1'>ПРЕВЬЮ</span>
                        )}
                    </div>
                )}
                {(isFirst || isLast) && (
                    <div className='opacity-90 flex items-center gap-1 mt-0.5 text-[10px]'>
                        <Clock className='w-3 h-3' />
                        {segmentStart.getHours().toString().padStart(2, '0')}:
                        {segmentStart.getMinutes().toString().padStart(2, '0')}
                        {totalSegments > 1 && (isFirst ? ' -... ' : ' ...- ')}
                        {totalSegments === 1 && ' - '}
                        {segmentEnd.getHours().toString().padStart(2, '0')}:
                        {segmentEnd.getMinutes().toString().padStart(2, '0')}
                    </div>
                )}
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
                        <Button variant='outline' size='icon' onClick={handlePrevWeek}>
                            <ChevronLeft className='w-5 h-5' />
                        </Button>
                        <Button variant='outline' size='icon' onClick={handleNextWeek}>
                            <ChevronRight className='w-5 h-5' />
                        </Button>
                    </div>
                    <Button variant='outline' onClick={handleToday} className='text-sm'>
                        Сегодня
                    </Button>
                    <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                        {weekDays[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}{' '}
                        –{' '}
                        {weekDays[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </h2>
                </div>

                {lastMape !== null && (
                    <div className='hidden md:flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-lg border border-green-200'>
                        <CheckCircle className='w-4 h-4 text-green-600' />
                        <span className='font-medium'>Система обучается:</span>
                        <span>Точность {(100 - lastMape).toFixed(1)}%</span>
                        <span className='text-green-800 font-bold'>(k={userSpeedFactor.toFixed(2)})</span>
                    </div>
                )}

                {/* Превью-панель с выбором варианта */}
                {previewMode && selectedVariant && availableVariants.length > 0 && (
                    <div className='flex flex-col gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800'>
                        <div className='flex items-center gap-2 flex-wrap'>
                            <span className='text-sm font-medium text-gray-700 dark:text-gray-300 mr-2'>Вариант:</span>
                            {availableVariants.map((variant) => (
                                <Button
                                    key={variant.id}
                                    variant={selectedVariant.id === variant.id ? 'default' : 'outline'}
                                    size='sm'
                                    onClick={() => handleVariantChange(variant.id)}
                                    className={selectedVariant.id === variant.id 
                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                        : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                    }
                                >
                                    {variant.name}
                                    {variant.id === (availableVariants.find(v => v.confidence === Math.max(...availableVariants.map(v => v.confidence)))?.id) && '⭐'}
                                </Button>
                            ))}
                        </div>
                        <div className='flex items-center gap-4 flex-wrap'>
                            <span className='text-sm text-gray-700 dark:text-gray-300'>{selectedVariant.description}</span>
                            <div className='flex gap-3 text-sm'>
                                <span className='text-gray-600 dark:text-gray-400'>📅 {selectedVariant.metrics.totalDays} дн.</span>
                                <span className='text-gray-600 dark:text-gray-400'>⏱️ {selectedVariant.metrics.avgLoadPerDay.toFixed(1)} ч/день</span>
                                <span className={`px-2 py-1 rounded ${getRiskBadgeColor(selectedVariant.metrics.riskScore)}`}>
                                    ⚠️ {(selectedVariant.metrics.riskScore * 100).toFixed(0)}% риск
                                </span>
                            </div>
                        </div>
                        <div className='flex gap-2 ml-auto'>
                            <Button variant='outline' onClick={() => {
                                setPreviewMode(false); setPreviewTasks([]); setPendingTaskData(null);
                                setSelectedVariant(null); setAvailableVariants([]);
                            }} size='sm'>✕ Отменить</Button>
                            <Button onClick={handleSavePreview} className='bg-green-600 hover:bg-green-700' size='sm'>✓ Сохранить</Button>
                        </div>
                    </div>
                )}

                <Button onClick={() => { setEditingTask(null); setIsCreateModalOpen(true); }} className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700'>
                    <Plus className='w-5 h-5' /> Создать задачу
                </Button>
            </div>

            {error && (
                <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 flex items-center gap-2'>
                    <AlertCircle className='w-5 h-5' /><p>{error}</p>
                </div>
            )}

            {/* Основной контент */}
            <div className='flex-1 overflow-hidden flex'>
                {/* Календарь */}
                <div className='flex-1 overflow-auto relative'>
                    <div className='flex min-w-250'>
                        <div className='w-16 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky left-0 z-20'>
                            <div className='h-12 border-b border-gray-200 dark:border-gray-800' />
                            {HOURS.map((hour) => (
                                <div key={hour} className='h-15 text-[10px] text-gray-500 dark:text-gray-400 text-right pr-2 pt-1'>
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        <div className='flex-1'>
                            <div className='grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 bg-white dark:bg-gray-950'>
                                {weekDays.map((day, index) => {
                                    const isToday = new Date().toDateString() === day.toDateString();
                                    return (
                                        <div key={index} className={`h-12 flex flex-col items-center justify-center border-l border-gray-200 dark:border-gray-800 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                            <span className='text-xs text-gray-500 dark:text-gray-400'>{DAYS[index]}</span>
                                            <span className={`text-lg font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                {day.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className='grid grid-cols-7 relative' onDragOver={(e) => e.preventDefault()}>
                                {weekDays.map((_, dayIndex) => (
                                    <div key={dayIndex} className='border-l border-gray-200 dark:border-gray-800'>
                                        {HOURS.map((hour) => (
                                            <div
                                                key={hour}
                                                className='h-15 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors'
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleDrop(e, dayIndex, hour)}
                                            />
                                        ))}
                                    </div>
                                ))}

                                {loading ? (
                                    <div className='absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 z-20'>
                                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' />
                                    </div>
                                ) : (
                                    allCalendarItems.map((task) => {
                                        const taskStart = new Date(task.startDate);
                                        const taskEnd = new Date(task.endDate);
                                        const daysInRange: Date[] = [];
                                        const current = new Date(taskStart);
                                        current.setHours(0, 0, 0, 0);
                                        const end = new Date(taskEnd);
                                        end.setHours(0, 0, 0, 0);

                                        while (current <= end) {
                                            daysInRange.push(new Date(current));
                                            current.setDate(current.getDate() + 1);
                                        }

                                        return daysInRange.map((dayDate, segmentIndex) => {
                                            const isDayInView = weekDays.some((d) => d.toDateString() === dayDate.toDateString());
                                            if (!isDayInView) return null;

                                            let dayIndex = dayDate.getDay() - 1;
                                            if (dayIndex === -1) dayIndex = 6;

                                            return renderTaskSegment(
                                                task as Task & { isPreview?: boolean },
                                                dayDate,
                                                dayIndex,
                                                segmentIndex,
                                                daysInRange.length,
                                            );
                                        }).filter(Boolean);
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🔥 Правая панель: ГЛАВНЫЕ ЗАДАЧИ */}
                <div className='w-80 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col z-30 shadow-xl'>
                    <div className='p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'>
                        <h3 className='text-sm font-bold uppercase text-gray-500 tracking-wider'>Задачи недели</h3>
                    </div>

                    <div className='flex-1 overflow-y-auto p-4 space-y-3'>
                        {weekTasks.length === 0 ? (
                            <div className='text-center text-gray-400 text-sm mt-10'>Нет активных задач</div>
                        ) : (
                            weekTasks.map((task) => {
                                const completedSubtasks = task.subtasks?.filter(s => s.status === 'done').length || 0;
                                const totalSubtasks = task.subtasks?.length || 0;
                                const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

                                return (
                                    <div
                                        key={task.id}
                                        // 🔥 task.id — number, highlightedTaskId — тоже number
                                        onMouseEnter={() => setHighlightedTaskId(task.id)}
                                        onMouseLeave={() => setHighlightedTaskId(null)}
                                        className={`group p-3 bg-white dark:bg-gray-800 rounded-lg border transition-all cursor-pointer ${
                                            highlightedTaskId === task.id
                                                ? 'border-blue-500 ring-2 ring-blue-400 shadow-md'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                        }`}
                                    >
                                        <div className='flex items-center justify-between mb-1'>
                                            <span className='text-sm font-medium truncate flex-1 mr-2'>{task.title}</span>
                                            <span className='text-xs font-mono text-gray-500'>
                                                {task.subtasks?.length ? `${completedSubtasks}/${totalSubtasks}` : '—'}
                                            </span>
                                        </div>
                                        <p className='text-xs text-gray-500 line-clamp-2 mb-2'>{task.description || 'Без описания'}</p>
                                        
                                        {totalSubtasks > 0 && (
                                            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2'>
                                                <div className='bg-blue-500 h-1.5 rounded-full transition-all' style={{ width: `${progress}%` }} />
                                            </div>
                                        )}

                                        <div className='flex items-center justify-between text-xs text-gray-400'>
                                            <div className='flex items-center gap-1'>
                                                <Clock className='w-3 h-3' />
                                                {Math.round((task.estimatedDuration || 0) / 60)} ч всего
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[10px] ${
                                                task.status === 'done' ? 'bg-green-100 text-green-700' :
                                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {task.status === 'done' ? 'Готово' : task.status === 'in_progress' ? 'В работе' : 'План'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Модалки */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setEditingTask(null); }}
                task={editingTask}
                onSubmit={handleCreateTask}
            />
            <CompleteTaskModal
                task={selectedTask}
                isOpen={isCompleteModalOpen}
                onClose={() => { setIsCompleteModalOpen(false); setSelectedTaskLocal(null); }}
            />
        </div>
    );
}

// Разработать модуль аутентификации через OAuth2 с поддержкой входа через Google и GitHub. Нужно настроить JWT-токены, добавить rate-limiting и написать unit-тесты. Дедлайн жёсткий — до пятницы.
