'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkLogs } from '@/store/slices/workLogSlice';
import {
    Container,
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import Header from '@/components/layout/Header';

export default function WorkLogsPage() {
    const dispatch = useAppDispatch();
    const { workLogs, loading } = useAppSelector((state) => state.workLog);

    useEffect(() => {
        dispatch(fetchWorkLogs());
    }, [dispatch]);

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
                    <Typography
                        variant='h4'
                        gutterBottom
                    >
                        📊 История работы
                    </Typography>
                    <Typography
                        variant='body2'
                        color='text.secondary'
                        paragraph
                    >
                        Записанное время для анализа и улучшения прогнозов
                    </Typography>

                    {loading ? (
                        <Typography>Загрузка...</Typography>
                    ) : workLogs.length === 0 ? (
                        <Typography color='text.secondary'>
                            Нет записей. Начните логировать время в задачах.
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Дата</TableCell>
                                        <TableCell>Задача</TableCell>
                                        <TableCell align='right'>
                                            Прогноз
                                        </TableCell>
                                        <TableCell align='right'>
                                            Факт
                                        </TableCell>
                                        <TableCell>Комментарий</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {workLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                {new Date(
                                                    log.createdAt,
                                                ).toLocaleDateString('ru-RU')}
                                            </TableCell>
                                            <TableCell>
                                                {log.task?.title ||
                                                    `Task #${log.taskId}`}
                                            </TableCell>
                                            <TableCell align='right'>
                                                {log.task?.estimatedHours ? (
                                                    <Chip
                                                        label={`${log.task.estimatedHours} ч.`}
                                                        size='small'
                                                        color='info'
                                                        variant='outlined'
                                                    />
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                            <TableCell align='right'>
                                                <Chip
                                                    label={`${log.hours} ч.`}
                                                    size='small'
                                                    color={
                                                        log.task
                                                            ?.estimatedHours &&
                                                        log.hours >
                                                            log.task
                                                                .estimatedHours
                                                            ? 'error'
                                                            : 'success'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {log.comment || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}
