'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchTasks,
    fetchTasksByDateRange,
    setSelectedTask,
} from '@/store/slices/taskSlice';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import {
    Container,
    Box,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Chip,
    IconButton,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import Header from '@/components/layout/Header';
import { Task } from '@/types';
import { useRouter } from 'next/navigation';

export default function CalendarPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { tasks, loading } = useAppSelector((state) => state.tasks);
    const calendarRef = useRef<FullCalendar>(null);

    const [selectedTask, setSelectedTaskState] = useState<Task | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchTasks());
    }, [dispatch]);

    // Конвертация задач в события календаря
    const calendarEvents = tasks.map((task) => ({
        id: task.id.toString(),
        title: task.title,
        start: task.dueDate || task.createdAt,
        end: task.dueDate || undefined,
        backgroundColor: getPriorityColor(task.priority),
        borderColor: getPriorityColor(task.priority),
        textColor: '#fff',
        extendedProps: { task },
    }));

    const handleEventClick = (clickInfo: any) => {
        const task = clickInfo.event.extendedProps.task as Task;
        setSelectedTaskState(task);
        setDialogOpen(true);
    };

    const handleDateClick = (clickInfo: any) => {
        // Можно открыть форму создания задачи на выбранную дату
        console.log('Clicked date:', clickInfo.dateStr);
    };

    const handleEventDrop = (clickInfo: any) => {
        // Обновление даты задачи при drag-and-drop
        const taskId = parseInt(clickInfo.event.id);
        const newDate = clickInfo.event.start.toISOString();
        console.log(`Task ${taskId} moved to ${newDate}`);
        // TODO: Dispatch update task
    };

    const handleDelete = () => {
        if (selectedTask) {
            // TODO: Dispatch delete task
            setDialogOpen(false);
            setDeleteConfirmOpen(false);
        }
    };

    return (
        <Box>
            <Header />

            <Container
                maxWidth='lg'
                sx={{ mt: 4, mb: 4 }}
            >
                <Paper
                    elevation={3}
                    sx={{ p: 3 }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography variant='h4'>📅 Календарь задач</Typography>
                        <Button
                            variant='contained'
                            onClick={() => router.push('/tasks')}
                        >
                            К списку задач
                        </Button>
                    </Box>

                    {/* Легенда приоритетов */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Chip
                            label='🔴 Высокий'
                            sx={{ bgcolor: '#d32f2f', color: '#fff' }}
                            size='small'
                        />
                        <Chip
                            label='🟡 Средний'
                            sx={{ bgcolor: '#ed6c02', color: '#fff' }}
                            size='small'
                        />
                        <Chip
                            label='🟢 Низкий'
                            sx={{ bgcolor: '#2e7d32', color: '#fff' }}
                            size='small'
                        />
                    </Box>

                    <Box sx={{ height: '70vh' }}>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[
                                dayGridPlugin,
                                timeGridPlugin,
                                interactionPlugin,
                            ]}
                            initialView='dayGridMonth'
                            locale={ruLocale}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay',
                            }}
                            events={calendarEvents}
                            eventClick={handleEventClick}
                            dateClick={handleDateClick}
                            eventDrop={handleEventDrop}
                            editable={true}
                            droppable={true}
                            height='100%'
                            eventContent={(eventInfo) => (
                                <Box
                                    sx={{
                                        px: 1,
                                        fontSize: '0.8rem',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <b>{eventInfo.timeText}</b>
                                    <br />
                                    <i>{eventInfo.event.title}</i>
                                </Box>
                            )}
                            noEventsText='Нет задач на этот период'
                        />
                    </Box>
                </Paper>
            </Container>

            {/* Диалог просмотра задачи */}
            <Dialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setSelectedTaskState(null);
                }}
                maxWidth='sm'
                fullWidth
            >
                {selectedTask && (
                    <>
                        <DialogTitle>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant='h6'>
                                    {selectedTask.title}
                                </Typography>
                                <IconButton
                                    size='small'
                                    onClick={() => setDialogOpen(false)}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip
                                    label={selectedTask.status}
                                    color={
                                        getStatusColor(
                                            selectedTask.status,
                                        ) as any
                                    }
                                    size='small'
                                />
                                <Chip
                                    label={selectedTask.priority}
                                    color={
                                        getPriorityColor(
                                            selectedTask.priority,
                                        ) as any
                                    }
                                    size='small'
                                    variant='outlined'
                                />
                            </Box>

                            {selectedTask.description && (
                                <Typography
                                    variant='body2'
                                    color='text.secondary'
                                    paragraph
                                >
                                    {selectedTask.description}
                                </Typography>
                            )}

                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                    mt: 2,
                                }}
                            >
                                {selectedTask.dueDate && (
                                    <Typography variant='body2'>
                                        📅 <strong>Срок:</strong>{' '}
                                        {new Date(
                                            selectedTask.dueDate,
                                        ).toLocaleDateString('ru-RU')}
                                    </Typography>
                                )}
                                {selectedTask.estimatedHours && (
                                    <Typography variant='body2'>
                                        ⏱️ <strong>Прогноз:</strong>{' '}
                                        {selectedTask.estimatedHours} ч.
                                    </Typography>
                                )}
                                <Typography variant='body2'>
                                    📝 <strong>Создано:</strong>{' '}
                                    {new Date(
                                        selectedTask.createdAt,
                                    ).toLocaleDateString('ru-RU')}
                                </Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDialogOpen(false)}>
                                Закрыть
                            </Button>
                            <Button
                                variant='contained'
                                onClick={() => {
                                    dispatch(setSelectedTask(selectedTask));
                                    setDialogOpen(false);
                                    router.push('/tasks');
                                }}
                            >
                                Редактировать
                            </Button>
                            <Button
                                color='error'
                                variant='outlined'
                                onClick={() => setDeleteConfirmOpen(true)}
                            >
                                Удалить
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Диалог подтверждения удаления */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить задачу "
                        {selectedTask?.title}"?
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
        </Box>
    );
}

// Вспомогательные функции
function getPriorityColor(priority: string): string {
    switch (priority) {
        case 'HIGH':
            return '#d32f2f';
        case 'MEDIUM':
            return '#ed6c02';
        case 'LOW':
            return '#2e7d32';
        default:
            return '#1976d2';
    }
}

function getStatusColor(status: string): string {
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
}
