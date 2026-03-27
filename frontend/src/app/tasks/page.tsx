'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchTasks,
    deleteTask,
    setSelectedTask,
    clearError,
} from '@/store/slices/taskSlice';

import { logout } from '@/store/slices/authSlice';
import SubtaskTree from '@/components/tasks/SubtaskTree';
import { fetchSubtasks } from '@/store/slices/subtaskSlice';

import {
    Container,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
} from '@mui/material';

import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    CheckCircle as DoneIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

import Header from '@/components/layout/Header';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
import WorkLogForm from '@/components/worklogs/WorkLogForm';
import { Task } from '@/types';

export default function TasksPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { tasks, loading, error, selectedTask } = useAppSelector(
        (state) => state.tasks,
    );
    const { user } = useAppSelector((state) => state.auth);
    const { subtasks } = useAppSelector((state) => state.subtasks);

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
    const [tabValue, setTabValue] = useState(0); // 0 = Details, 1 = Subtasks
    const [workLogTask, setWorkLogTask] = useState<Task | null>(null);
    const [workLogDialogOpen, setWorkLogDialogOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchTasks());
    }, [dispatch]);

    const handleDelete = () => {
        if (taskToDelete) {
            dispatch(deleteTask(taskToDelete));
            setDeleteConfirmOpen(false);
            setTaskToDelete(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE':
                return 'success';
            case 'IN_PROGRESS':
                return 'warning';
            case 'TODO':
                return 'default';
            case 'CANCELLED':
                return 'error';
            default:
                return 'default';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'error';
            case 'MEDIUM':
                return 'warning';
            case 'LOW':
                return 'info';
            default:
                return 'default';
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (loading && tasks.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Header />

            <Container
                maxWidth='lg'
                sx={{ mt: 4, mb: 4 }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                    }}
                >
                    <Box>
                        <Typography
                            variant='h4'
                            gutterBottom
                        >
                            📋 Мои задачи
                        </Typography>
                        <Typography
                            variant='body2'
                            color='text.secondary'
                        >
                            Пользователь: {user?.name || user?.email}
                        </Typography>
                    </Box>
                    <Button
                        variant='contained'
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        Новая задача
                    </Button>
                </Box>

                {error && (
                    <Alert
                        severity='error'
                        sx={{ mb: 3 }}
                        onClose={() => dispatch(clearError())}
                    >
                        {error}
                    </Alert>
                )}

                {tasks.length === 0 ? (
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 8 }}>
                            <Typography
                                variant='h6'
                                color='text.secondary'
                                gutterBottom
                            >
                                Нет задач
                            </Typography>
                            <Typography
                                variant='body2'
                                color='text.secondary'
                            >
                                Создайте первую задачу, чтобы начать
                                планирование
                            </Typography>
                            <Button
                                variant='contained'
                                startIcon={<AddIcon />}
                                onClick={() => setCreateDialogOpen(true)}
                                sx={{ mt: 2 }}
                            >
                                Создать задачу
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Box sx={{ display: 'grid', gap: 2 }}>
                        {tasks.map((task) => (
                            <Card
                                key={task.id}
                                sx={{
                                    bgcolor:
                                        task.status === 'DONE'
                                            ? 'action.disabledBackground'
                                            : 'background.paper',
                                }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 1,
                                                    mb: 1,
                                                }}
                                            >
                                                <Chip
                                                    label={task.status}
                                                    color={
                                                        getStatusColor(
                                                            task.status,
                                                        ) as any
                                                    }
                                                    size='small'
                                                    icon={
                                                        task.status ===
                                                        'DONE' ? (
                                                            <DoneIcon />
                                                        ) : task.status ===
                                                          'IN_PROGRESS' ? (
                                                            <PendingIcon />
                                                        ) : (
                                                            <ScheduleIcon />
                                                        )
                                                    }
                                                />
                                                <Chip
                                                    label={task.priority}
                                                    color={
                                                        getPriorityColor(
                                                            task.priority,
                                                        ) as any
                                                    }
                                                    size='small'
                                                    variant='outlined'
                                                />
                                            </Box>
                                            <Typography
                                                variant='h6'
                                                gutterBottom
                                            >
                                                {task.title}
                                            </Typography>
                                            {task.description && (
                                                <Typography
                                                    variant='body2'
                                                    color='text.secondary'
                                                    sx={{ mb: 1 }}
                                                >
                                                    {task.description}
                                                </Typography>
                                            )}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 2,
                                                    mt: 2,
                                                }}
                                            >
                                                {task.estimatedHours && (
                                                    <Typography
                                                        variant='body2'
                                                        color='text.secondary'
                                                    >
                                                        ⏱️ Прогноз:{' '}
                                                        {task.estimatedHours} ч.
                                                    </Typography>
                                                )}
                                                {task.dueDate && (
                                                    <Typography
                                                        variant='body2'
                                                        color='text.secondary'
                                                    >
                                                        📅 Срок:{' '}
                                                        {new Date(
                                                            task.dueDate,
                                                        ).toLocaleDateString()}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton
                                                size='small'
                                                color='primary'
                                                onClick={() => {
                                                    setWorkLogTask(task); // ✅ Сохраняем задачу в локальное состояние
                                                    setWorkLogDialogOpen(true);
                                                }}
                                                title='Записать время'
                                            >
                                                <AccessTimeIcon />
                                            </IconButton>
                                            <IconButton
                                                size='small'
                                                onClick={() => {
                                                    dispatch(
                                                        setSelectedTask(task),
                                                    );
                                                    setCreateDialogOpen(true);
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size='small'
                                                color='error'
                                                onClick={() => {
                                                    setTaskToDelete(task.id);
                                                    setDeleteConfirmOpen(true);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Container>

            {/* Диалог создания/редактирования задачи */}
            <Dialog
                open={createDialogOpen}
                onClose={() => {
                    setCreateDialogOpen(false);
                    dispatch(setSelectedTask(null));
                    setTabValue(0); // Сброс вкладки при закрытии
                }}
                maxWidth='md' // Чуть шире для дерева подзадач
                fullWidth
            >
                {/* Заголовок с вкладками */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        sx={{ px: 2 }}
                    >
                        <Tab label='📝 Детали задачи' />
                        <Tab label='📋 Подзадачи' />
                    </Tabs>
                </Box>

                {/* Контент вкладок */}
                <Box sx={{ p: 2 }}>
                    {/* Вкладка 1: Детали задачи (форма) */}
                    <TabPanel
                        value={tabValue}
                        index={0}
                    >
                        <CreateTaskForm
                            onClose={() => {
                                setCreateDialogOpen(false);
                                dispatch(setSelectedTask(null));
                                setTabValue(0);
                            }}
                        />
                    </TabPanel>

                    {/* Вкладка 2: Дерево подзадач */}
                    <TabPanel
                        value={tabValue}
                        index={1}
                    >
                        {selectedTask ? (
                            <SubtaskTree
                                taskId={selectedTask.id}
                                subtasks={subtasks[selectedTask.id] || []}
                                onAddSubtask={(parentId) => {
                                    // TODO: Открыть модалку создания подзадачи
                                    console.log(
                                        'Add subtask to parent:',
                                        parentId,
                                    );
                                }}
                            />
                        ) : (
                            <Typography color='text.secondary'>
                                Выберите задачу для просмотра подзадач
                            </Typography>
                        )}
                    </TabPanel>
                </Box>
            </Dialog>

            {/* Диалог подтверждения удаления */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить эту задачу?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>
                        Отмена
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color='error'
                        variant='contained'
                    >
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог для записи рабочего времени */}
            <Dialog
                open={workLogDialogOpen}
                onClose={() => {
                    setWorkLogDialogOpen(false);
                    setWorkLogTask(null); // ✅ Очищаем после закрытия
                }}
                maxWidth='sm'
                fullWidth
            >
                {workLogTask ? ( // ✅ Проверка на null
                    <WorkLogForm
                        taskId={workLogTask.id}
                        taskTitle={workLogTask.title}
                        estimatedHours={workLogTask.estimatedHours}
                        onClose={() => {
                            setWorkLogDialogOpen(false);
                            setWorkLogTask(null);
                        }}
                    />
                ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color='text.secondary'>
                            Задача не выбрана
                        </Typography>
                        <Button
                            onClick={() => setWorkLogDialogOpen(false)}
                            sx={{ mt: 2 }}
                        >
                            Закрыть
                        </Button>
                    </Box>
                )}
            </Dialog>
        </Box>
    );
}

// Вспомогательный компонент для вкладок
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <Box
            role='tabpanel'
            hidden={value !== index}
            id={`task-dialog-tabpanel-${index}`}
            aria-labelledby={`task-dialog-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </Box>
    );
}
