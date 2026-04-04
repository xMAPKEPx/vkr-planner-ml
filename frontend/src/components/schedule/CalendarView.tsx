'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTasks, setSelectedTask } from '@/store/slices/taskSlice';
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';
import CreateTaskModal from '../tasks/CreateTaskModal';
import CompleteTaskModal from '../tasks/CompleteTaskModal';

const hours = Array.from({ length: 24 }, (_, i) => i);
const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface TaskData {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  estimatedDuration?: number;
  mode: 'manual' | 'ai';
  aiGenerated?: boolean;
}

export default function CalendarView() {
  const dispatch = useAppDispatch();
  
  // Redux state
  const { tasks, loading } = useAppSelector((state) => state.tasks);
  const { context, currentProjectId } = useAppSelector((state) => state.context);
  
  // Local state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date(2026, 3, 4));
  const [selectedTask, setSelectedTaskLocal] = useState<Task | null>(null);

  // Загружаем задачи при монтировании компонента
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Навигация по неделям
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

  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  // Получаем дни текущей недели
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

  // Обработчик создания задачи (отправка в Redux)
  const handleCreateTask = (taskData: TaskData) => {
    // Преобразуем данные из модалки в формат Task
    const newTask: Partial<Task> = {
      title: taskData.title,
      description: taskData.description,
      estimatedDuration: taskData.estimatedDuration || 60,
      startDate: taskData.startDate ? new Date(taskData.startDate) : new Date(),
      endDate: taskData.endDate ? new Date(taskData.endDate) : new Date(),
      status: 'todo',
      userId: 'user-1', // TODO: взять из auth slice
      projectId: context === 'project' ? currentProjectId || undefined : undefined,
      category: 'general',
    };
    
    // Здесь будет dispatch(createTask(newTask))
    console.log('📝 Создание задачи:', newTask);
    setIsCreateModalOpen(false);
  };

  // Обработчик клика по задаче (открыть модалку завершения)
  const handleTaskClick = (task: Task) => {
    if (task.status !== 'done') {
      setSelectedTaskLocal(task);
      dispatch(setSelectedTask(task));
      setIsCompleteModalOpen(true);
    }
  };

  // Позиционирование задачи на сетке
  const getTaskPosition = (task: Task) => {
    const startHour = task.startDate.getHours();
    const startMinutes = task.startDate.getMinutes();
    const durationHours = (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60);
    
    return {
      top: `${(startHour + startMinutes / 60) * 60}px`,
      height: `${durationHours * 60}px`,
    };
  };

  // Цвет задачи в зависимости от статуса
  const getTaskColor = (task: Task) => {
    if (task.status === 'done') return 'bg-gray-400';
    if (task.status === 'in_progress') return 'bg-blue-500';
    return 'bg-purple-500';
  };

  // Фильтруем задачи для текущей недели
  const weekTasks = tasks.filter((task) => {
    const taskDate = new Date(task.startDate);
    return (
      taskDate >= weekDays[0] && 
      taskDate <= new Date(weekDays[6].getTime() + 24 * 60 * 60 * 1000)
    );
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          <Button variant="outline" onClick={handleToday} className="text-sm">
            Сегодня
          </Button>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {weekDays[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} – {weekDays[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Создать задачу
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-16 shrink-0 border-r border-gray-200 dark:border-gray-800">
            <div className="h-12 border-b border-gray-200 dark:border-gray-800" />
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-15 text-xs text-gray-500 dark:text-gray-400 text-right pr-2 pt-1"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Days columns */}
          <div className="flex-1">
            {/* Days header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
              {weekDays.map((day, index) => {
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                  <div
                    key={index}
                    className={`h-12 flex flex-col items-center justify-center border-l border-gray-200 dark:border-gray-800 ${
                      isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {days[index]}
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

            {/* Time slots */}
            <div className="grid grid-cols-7 relative">
              {weekDays.map((_, index) => (
                <div
                  key={index}
                  className="border-l border-gray-200 dark:border-gray-800"
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-15 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    />
                  ))}
                </div>
              ))}

              {/* Tasks overlay - теперь из Redux */}
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                weekTasks.map((task) => {
                  const position = getTaskPosition(task);
                  const dayIndex = task.startDate.getDay() - 1;
                  if (dayIndex < 0 || dayIndex > 6) return null;
                  
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className={`absolute ${getTaskColor(task)} text-white p-2 rounded-md text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm group`}
                      style={{
                        left: `calc(${(dayIndex / 7) * 100}% + 4px)`,
                        top: position.top,
                        width: `calc(${100 / 7}% - 8px)`,
                        height: position.height,
                      }}
                    >
                      <div className="font-semibold truncate">{task.title}</div>
                      <div className="opacity-90 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {task.startDate.getHours().toString().padStart(2, '0')}:
                        {task.startDate.getMinutes().toString().padStart(2, '0')}
                      </div>
                      {context === 'project' && task.assignee && (
                        <div className="opacity-75 mt-1 truncate">{task.assignee}</div>
                      )}
                      
                      {/* Индикатор для завершения (появляется при наведении) */}
                      {task.status !== 'done' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
      />

      {/* Complete Task Modal (WorkLog для self-finetuning) */}
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