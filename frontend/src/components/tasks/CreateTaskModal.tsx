'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createTask, updateTask } from '@/store/slices/taskSlice';
import {
    X,
    Sparkles,
    Type,
    Calendar,
    Clock,
    Users,
    Save,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Task, Subtask } from '@/types';
import { decomposeTask } from '@/lib/mlApi';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task?: Task | null;
}

// Вспомогательная функция: конвертируем строки в объекты Subtask
const stringArrayToSubtasks = (titles: string[]): Subtask[] => {
    return titles
        .filter((t) => t.trim())
        .map((title, index) => ({
            id: `subtask-${Date.now()}-${index}`,
            title: title.trim(),
            estimatedDuration: 30, // Дефолтное время, можно улучшить
            status: 'todo' as const,
        }));
};

export default function CreateTaskModal({
    isOpen,
    onClose,
    task,
}: CreateTaskModalProps) {
    const dispatch = useAppDispatch();
    const { context, currentProjectId, teams } = useAppSelector(
        (state) => state.context,
    );
    const currentSpeedFactor = useAppSelector(
        (state) => state.tasks.userSpeedFactor,
    );

    const isEditMode = !!task;
    const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States for manual mode
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [assignee, setAssignee] = useState('');
    const [subtasks, setSubtasks] = useState<string[]>(['']);

    // State for AI mode
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Get current project members
    const currentProject = teams
        .flatMap((t) => t.projects)
        .find((p) => p.id === currentProjectId);
    const members = currentProject?.members || [];

    // Заполняем форму при редактировании
    useEffect(() => {
        if (task && isOpen) {
            setTitle(task.title);
            setDescription(task.description || '');
            if (task.startDate) {
                const d = new Date(task.startDate);
                setStartDate(d.toISOString().slice(0, 16));
            }
            if (task.endDate) {
                const d = new Date(task.endDate);
                setEndDate(d.toISOString().slice(0, 16));
            }
            if (task.assignee) setAssignee(task.assignee);
            if (task.subtasks?.length) {
                setSubtasks(task.subtasks.map((st) => st.title));
            }
            setActiveTab('manual');
        } else if (!isEditMode) {
            resetForm();
        }
    }, [task, isOpen, isEditMode]);

    const handleAddSubtask = () => setSubtasks([...subtasks, '']);
    const handleRemoveSubtask = (index: number) =>
        setSubtasks(subtasks.filter((_, i) => i !== index));
    const handleSubtaskChange = (index: number, value: string) => {
        const newSubtasks = [...subtasks];
        newSubtasks[index] = value;
        setSubtasks(newSubtasks);
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setIsSubmitting(true);

        try {
            const taskData: Partial<Task> = {
                title,
                description,
                startDate: startDate
                    ? new Date(startDate).toISOString()
                    : undefined,
                endDate: endDate ? new Date(endDate).toISOString() : undefined,
                estimatedDuration:
                    startDate && endDate
                        ? (new Date(endDate).getTime() -
                              new Date(startDate).getTime()) /
                          60000
                        : 60,
                assignee:
                    context === 'project' ? assignee || undefined : undefined,
                // ✅ Конвертируем string[] → Subtask[]
                subtasks: stringArrayToSubtasks(subtasks),
                category: 'general',
            };

            if (isEditMode && task) {
                await dispatch(
                    updateTask({ taskId: task.id, updates: taskData }),
                ).unwrap();
            } else {
                await dispatch(createTask(taskData)).unwrap();
            }
            onClose();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAISubmit = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);

        try {
            const result = await decomposeTask(
                aiPrompt,
                aiPrompt,
                null,
                currentSpeedFactor,
            );

            // Реалистичное время старта: завтра в 9:00, если сейчас позже 9 утра
            const now = new Date();
            const startDate = new Date();
            startDate.setHours(9, 0, 0, 0);
            if (now.getHours() >= 9) {
                startDate.setDate(startDate.getDate() + 1);
            }

            // Расчет endDate: приоритет — распарсенный дедлайн
            let endDate: Date;
            if (result.parsedDeadline) {
                endDate = new Date(result.parsedDeadline);
                endDate.setHours(18, 0, 0, 0);
            } else {
                const totalHours = result.subtasks.reduce(
                    (sum, st) => sum + st.estimatedHours,
                    0,
                );
                endDate = new Date(
                    startDate.getTime() + totalHours * 60 * 60 * 1000,
                );
            }

            // ✅ Правильный маппинг подзадач в формат Subtask
            const mappedSubtasks: Subtask[] = result.subtasks.map(
                (st, idx) => ({
                    id: `ml-${Date.now()}-${idx}`,
                    title: st.title,
                    description: st.description || undefined,
                    estimatedDuration: Math.round(st.estimatedHours * 60), // часы → минуты
                    actualDuration: undefined,
                    status: 'todo' as const,
                }),
            );

            const newTaskData: Partial<Task> = {
                title: aiPrompt.split(/[.!?]/)[0].trim(),
                description: aiPrompt,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                estimatedDuration: Math.round(
                    result.subtasks.reduce(
                        (sum, st) => sum + st.estimatedHours,
                        0,
                    ) * 60,
                ),
                subtasks: mappedSubtasks, // ✅ Передаём массив подзадач
                category: result.category,
                userId: 'user-1',
                status: 'todo',
            };

            console.log('📝 Creating task:', newTaskData); // Для отладки
            await dispatch(createTask(newTaskData)).unwrap();
            console.log('📦 Отправляем в Redux. Subtasks:', newTaskData.subtasks);

            setIsGenerating(false);
            setAiPrompt('');
            onClose();
        } catch (error) {
            console.error('❌ ML-Core:', error);
            setIsGenerating(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setAssignee('');
        setSubtasks(['']);
        setAiPrompt('');
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={onClose}
        >
            <DialogContent className='sm:max-w-150 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <div className='flex items-center justify-between'>
                        <DialogTitle className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>
                            {isEditMode
                                ? '✏️ Редактировать задачу'
                                : '➕ Создать задачу'}
                        </DialogTitle>
                        <button
                            onClick={onClose}
                            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        ></button>
                    </div>
                </DialogHeader>

                {!isEditMode && (
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) =>
                            setActiveTab(v as 'manual' | 'ai')
                        }
                        className='mt-4'
                    >
                        <TabsList className='grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800'>
                            <TabsTrigger
                                value='manual'
                                className='flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700'
                            >
                                <Type className='w-4 h-4' />
                                Ручной ввод
                            </TabsTrigger>
                            <TabsTrigger
                                value='ai'
                                className='flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700'
                            >
                                <Sparkles className='w-4 h-4' />
                                AI разбор (NLP)
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value='manual'
                            className='space-y-4 mt-6'
                        >
                            <ManualFormContent
                                title={title}
                                setTitle={setTitle}
                                description={description}
                                setDescription={setDescription}
                                startDate={startDate}
                                setStartDate={setStartDate}
                                endDate={endDate}
                                setEndDate={setEndDate}
                                assignee={assignee}
                                setAssignee={setAssignee}
                                subtasks={subtasks}
                                onAddSubtask={handleAddSubtask}
                                onRemoveSubtask={handleRemoveSubtask}
                                onSubtaskChange={handleSubtaskChange}
                                members={members}
                                context={context}
                            />
                        </TabsContent>

                        <TabsContent
                            value='ai'
                            className='space-y-4 mt-6'
                        >
                            <AIFromContent
                                aiPrompt={aiPrompt}
                                setAiPrompt={setAiPrompt}
                                isGenerating={isGenerating}
                                members={members}
                                context={context}
                                assignee={assignee}
                                setAssignee={setAssignee}
                                onSubmit={handleAISubmit}
                            />
                        </TabsContent>
                    </Tabs>
                )}

                {isEditMode && (
                    <ManualFormContent
                        title={title}
                        setTitle={setTitle}
                        description={description}
                        setDescription={setDescription}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        assignee={assignee}
                        setAssignee={setAssignee}
                        subtasks={subtasks}
                        onAddSubtask={handleAddSubtask}
                        onRemoveSubtask={handleRemoveSubtask}
                        onSubtaskChange={handleSubtaskChange}
                        members={members}
                        context={context}
                    />
                )}

                <div className='flex justify-end gap-3 pt-4 border-t dark:border-gray-800'>
                    <Button
                        variant='outline'
                        onClick={onClose}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={
                            isEditMode || activeTab === 'manual'
                                ? handleSubmit
                                : handleAISubmit
                        }
                        disabled={
                            (activeTab === 'manual' && !title.trim()) ||
                            (activeTab === 'ai' &&
                                (!aiPrompt.trim() || isGenerating)) ||
                            isSubmitting
                        }
                        className='bg-blue-600 hover:bg-blue-700'
                    >
                        {isSubmitting ? (
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        ) : isEditMode ? (
                            <Save className='w-4 h-4 mr-2' />
                        ) : activeTab === 'ai' ? (
                            <Sparkles className='w-4 h-4 mr-2' />
                        ) : null}
                        {isSubmitting
                            ? 'Сохранение...'
                            : isEditMode
                              ? 'Сохранить изменения'
                              : activeTab === 'ai'
                                ? 'Сгенерировать план'
                                : 'Создать задачу'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ========== Вспомогательные компоненты с типами ==========

interface ManualFormContentProps {
    title: string;
    setTitle: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
    assignee: string;
    setAssignee: (v: string) => void;
    subtasks: string[];
    onAddSubtask: () => void;
    onRemoveSubtask: (index: number) => void;
    onSubtaskChange: (index: number, value: string) => void;
    members: Array<{ id: string; name: string }>;
    context: 'personal' | 'project';
}

function ManualFormContent({
    title,
    setTitle,
    description,
    setDescription,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    assignee,
    setAssignee,
    subtasks,
    onAddSubtask,
    onRemoveSubtask,
    onSubtaskChange,
    members,
    context,
}: ManualFormContentProps) {
    return (
        <div className='space-y-4'>
            <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Название задачи *
                </label>
                <Input
                    placeholder='Введите название задачи'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className='dark:bg-gray-800 dark:border-gray-700'
                />
            </div>

            <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Описание
                </label>
                <Textarea
                    placeholder='Опишите задачу подробнее'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className='dark:bg-gray-800 dark:border-gray-700'
                />
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                        <Calendar className='w-4 h-4' /> Начало
                    </label>
                    <Input
                        type='datetime-local'
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className='dark:bg-gray-800 dark:border-gray-700'
                    />
                </div>
                <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                        <Clock className='w-4 h-4' /> Окончание
                    </label>
                    <Input
                        type='datetime-local'
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className='dark:bg-gray-800 dark:border-gray-700'
                    />
                </div>
            </div>

            {context === 'project' && members.length > 0 && (
                <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                        <Users className='w-4 h-4' /> Исполнитель
                    </label>
                    <Select
                        value={assignee}
                        onValueChange={setAssignee}
                    >
                        <SelectTrigger className='dark:bg-gray-800 dark:border-gray-700'>
                            <SelectValue placeholder='Выберите исполнителя' />
                        </SelectTrigger>
                        <SelectContent className='dark:bg-gray-800 dark:border-gray-700'>
                            {members.map((member) => (
                                <SelectItem
                                    key={member.id}
                                    value={member.id}
                                >
                                    {member.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        Подзадачи
                    </label>
                    <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={onAddSubtask}
                    >
                        + Добавить
                    </Button>
                </div>
                <div className='space-y-2 max-h-48 overflow-y-auto'>
                    {subtasks.map((subtask, index) => (
                        <div
                            key={index}
                            className='flex gap-2'
                        >
                            <Input
                                placeholder={`Подзадача ${index + 1}`}
                                value={subtask}
                                onChange={(e) =>
                                    onSubtaskChange(index, e.target.value)
                                }
                                className='dark:bg-gray-800 dark:border-gray-700'
                            />
                            {subtasks.length > 1 && (
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => onRemoveSubtask(index)}
                                >
                                    <X className='w-4 h-4' />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface AIFromContentProps {
    aiPrompt: string;
    setAiPrompt: (v: string) => void;
    isGenerating: boolean;
    members: Array<{ id: string; name: string }>;
    context: 'personal' | 'project';
    assignee: string;
    setAssignee: (v: string) => void;
    onSubmit: () => void;
}

function AIFromContent({
    aiPrompt,
    setAiPrompt,
    members,
    context,
    assignee,
    setAssignee,
}: AIFromContentProps) {
    return (
        <div className='space-y-4'>
            <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Опишите задачу своими словами
                </label>
                <Textarea
                    placeholder="Например: 'Нужно сделать авторизацию через Google и подключить базу данных до пятницы'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={6}
                    className='dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500'
                />
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Система автоматически разобьет задачу на подзадачи, оценит
                    время и предложит оптимальное расписание
                </p>
            </div>

            {context === 'project' && members.length > 0 && (
                <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                        <Users className='w-4 h-4' /> Исполнитель
                    </label>
                    <Select
                        value={assignee}
                        onValueChange={setAssignee}
                    >
                        <SelectTrigger className='dark:bg-gray-800 dark:border-gray-700'>
                            <SelectValue placeholder='Кому назначить задачу?' />
                        </SelectTrigger>
                        <SelectContent className='dark:bg-gray-800 dark:border-gray-700'>
                            {members.map((member) => (
                                <SelectItem
                                    key={member.id}
                                    value={member.id}
                                >
                                    {member.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className='p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800'>
                <p className='text-xs text-purple-700 dark:text-purple-300 font-medium'>
                    💡 Как это работает (для ВКР):
                </p>
                <p className='text-xs text-purple-600 dark:text-purple-400 mt-1'>
                    При нажатии «Сгенерировать» текст отправляется в NLP-модуль,
                    который извлекает: название, дедлайн, подзадачи и приоритет.
                </p>
            </div>
        </div>
    );
}
