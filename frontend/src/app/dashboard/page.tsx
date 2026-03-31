'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchDashboardStats,
    fetchAccuracyTrend,
    fetchCategoryStats,
} from '@/store/slices/dashboardSlice';
import {
    Container,
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import Header from '@/components/layout/Header';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardPage() {
    const dispatch = useAppDispatch();
    const { stats, accuracyTrend, categoryStats, loading, error } =
        useAppSelector((state) => state.dashboard);
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchDashboardStats());
        dispatch(fetchAccuracyTrend());
        dispatch(fetchCategoryStats());
    }, [dispatch]);

    if (loading || !stats) {
        return (
            <Box>
                <Header />
                <Container
                    maxWidth='lg'
                    sx={{ mt: 8, textAlign: 'center' }}
                >
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>
                        Загрузка статистики...
                    </Typography>
                </Container>
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
                {/* Заголовок */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant='h4'
                        gutterBottom
                    >
                        📊 Панель статистики
                    </Typography>
                    <Typography
                        variant='body2'
                        color='text.secondary'
                    >
                        Пользователь: {user?.name || user?.email} | Speed
                        Factor: {stats?.speedFactor?.toFixed(2) || '—'}
                    </Typography>
                </Box>

                {error && (
                    <Alert
                        severity='error'
                        sx={{ mb: 3 }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Карточки с метриками */}
                <Grid
                    container
                    spacing={3}
                    sx={{ mb: 4 }}
                >
                    <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                    >
                        <Card>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <ScheduleIcon color='primary' />
                                    <Box>
                                        <Typography variant='h4'>
                                            {stats?.totalTasks || 0}
                                        </Typography>
                                        <Typography
                                            variant='body2'
                                            color='text.secondary'
                                        >
                                            Всего задач
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                    >
                        <Card>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <CheckCircleIcon color='success' />
                                    <Box>
                                        <Typography variant='h4'>
                                            {stats?.completedTasks || 0}
                                        </Typography>
                                        <Typography
                                            variant='body2'
                                            color='text.secondary'
                                        >
                                            Выполнено
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                    >
                        <Card>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <TrendingUpIcon color='info' />
                                    <Box>
                                        <Typography variant='h4'>
                                            {stats?.avgAccuracy
                                                ? `${(stats.avgAccuracy * 100).toFixed(0)}%`
                                                : '—'}
                                        </Typography>
                                        <Typography
                                            variant='body2'
                                            color='text.secondary'
                                        >
                                            Точность оценок
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                    >
                        <Card>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <WarningIcon color='warning' />
                                    <Box>
                                        <Typography variant='h4'>
                                            {stats?.tasksLate || 0}
                                        </Typography>
                                        <Typography
                                            variant='body2'
                                            color='text.secondary'
                                        >
                                            Просрочено
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* График точности по месяцам */}
                <Paper
                    elevation={3}
                    sx={{ p: 3, mb: 4 }}
                >
                    <Typography
                        variant='h6'
                        gutterBottom
                    >
                        📈 Точность оценок по месяцам (Раздел 3.2.4 ВКР)
                    </Typography>
                    <Typography
                        variant='body2'
                        color='text.secondary'
                        paragraph
                    >
                        Динамика изменения точности прогнозирования времени
                        выполнения задач
                    </Typography>

                    {accuracyTrend.length === 0 ? (
                        <Typography
                            color='text.secondary'
                            sx={{ py: 4, textAlign: 'center' }}
                        >
                            Нет данных. Начните выполнять задачи для сбора
                            статистики.
                        </Typography>
                    ) : (
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer
                                width='100%'
                                height='100%'
                            >
                                <LineChart data={accuracyTrend}>
                                    <CartesianGrid strokeDasharray='3 3' />
                                    <XAxis dataKey='month' />
                                    <YAxis
                                        yAxisId='left'
                                        orientation='left'
                                        stroke='#8884d8'
                                        label={{
                                            value: 'Точность (%)',
                                            angle: -90,
                                            position: 'insideLeft',
                                        }}
                                    />
                                    <YAxis
                                        yAxisId='right'
                                        orientation='right'
                                        stroke='#82ca9d'
                                        label={{
                                            value: 'Часы',
                                            angle: 90,
                                            position: 'insideRight',
                                        }}
                                    />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        yAxisId='left'
                                        type='monotone'
                                        dataKey='accuracy'
                                        name='Точность (%)'
                                        stroke='#8884d8'
                                    />
                                    <Line
                                        yAxisId='right'
                                        type='monotone'
                                        dataKey='estimatedHours'
                                        name='Прогноз (ч)'
                                        stroke='#82ca9d'
                                    />
                                    <Line
                                        yAxisId='right'
                                        type='monotone'
                                        dataKey='actualHours'
                                        name='Факт (ч)'
                                        stroke='#ff7300'
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    )}
                </Paper>

                {/* Статистика по категориям */}
                <Paper
                    elevation={3}
                    sx={{ p: 3, mb: 4 }}
                >
                    <Typography
                        variant='h6'
                        gutterBottom
                    >
                        📊 Статистика по категориям задач
                    </Typography>
                    <Typography
                        variant='body2'
                        color='text.secondary'
                        paragraph
                    >
                        Распределение задач по категориям с метриками точности
                    </Typography>

                    {categoryStats.length === 0 ? (
                        <Typography
                            color='text.secondary'
                            sx={{ py: 4, textAlign: 'center' }}
                        >
                            Нет данных по категориям
                        </Typography>
                    ) : (
                        <Grid
                            container
                            spacing={3}
                        >
                            <Grid
                                item
                                xs={12}
                                md={6}
                            >
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer
                                        width='100%'
                                        height='100%'
                                    >
                                        <BarChart data={categoryStats}>
                                            <CartesianGrid strokeDasharray='3 3' />
                                            <XAxis dataKey='category' />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar
                                                dataKey='count'
                                                name='Количество задач'
                                                fill='#8884d8'
                                            />
                                            <Bar
                                                dataKey='accuracy'
                                                name='Точность (%)'
                                                fill='#82ca9d'
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                md={6}
                            >
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Категория</TableCell>
                                                <TableCell align='right'>
                                                    Задач
                                                </TableCell>
                                                <TableCell align='right'>
                                                    Прогноз (ч)
                                                </TableCell>
                                                <TableCell align='right'>
                                                    Факт (ч)
                                                </TableCell>
                                                <TableCell align='right'>
                                                    Точность
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {categoryStats.map((cat) => (
                                                <TableRow key={cat.category}>
                                                    <TableCell>
                                                        {cat.category}
                                                    </TableCell>
                                                    <TableCell align='right'>
                                                        {cat.count}
                                                    </TableCell>
                                                    <TableCell align='right'>
                                                        {cat.avgEstimatedHours?.toFixed(
                                                            1,
                                                        )}
                                                    </TableCell>
                                                    <TableCell align='right'>
                                                        {cat.avgActualHours?.toFixed(
                                                            1,
                                                        )}
                                                    </TableCell>
                                                    <TableCell align='right'>
                                                        <Chip
                                                            label={`${(cat.accuracy * 100).toFixed(0)}%`}
                                                            color={
                                                                cat.accuracy >=
                                                                0.8
                                                                    ? 'success'
                                                                    : cat.accuracy >=
                                                                        0.6
                                                                      ? 'warning'
                                                                      : 'error'
                                                            }
                                                            size='small'
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}
                </Paper>

                {/* Self-Finetuning информация */}
                <Paper
                    elevation={3}
                    sx={{ p: 3 }}
                >
                    <Typography
                        variant='h6'
                        gutterBottom
                    >
                        🤖 Self-Finetuning (Раздел 3.3.1 ВКР)
                    </Typography>
                    <Typography
                        variant='body2'
                        color='text.secondary'
                        paragraph
                    >
                        Алгоритм статистического самообучения на основе WorkLog
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                        <Typography
                            variant='subtitle2'
                            gutterBottom
                        >
                            Формула расчёта speed_factor:
                        </Typography>
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: 'background.default',
                                borderRadius: 1,
                                fontFamily: 'monospace',
                            }}
                        >
                            k_скорости = 1/N × Σ(t_план,i / t_факт,i)
                        </Box>

                        <Typography
                            variant='subtitle2'
                            sx={{ mt: 2 }}
                            gutterBottom
                        >
                            Текущие показатели:
                        </Typography>
                        <Grid
                            container
                            spacing={2}
                            sx={{ mt: 1 }}
                        >
                            <Grid
                                item
                                xs={12}
                                sm={4}
                            >
                                <Card variant='outlined'>
                                    <CardContent>
                                        <Typography
                                            variant='body2'
                                            color='text.secondary'
                                        >
                                            Speed Factor
                                        </Typography>
                                        <Typography variant='h5'>
                                            {stats?.speedFactor?.toFixed(2) ||
                                                '1.00'}
                                        </Typography>
                                        <Typography
                                            variant='caption'
                                            color='text.secondary'
                                        >
                                            {stats && stats.speedFactor > 1
                                                ? 'Быстрее среднего'
                                                : stats.speedFactor < 1
                                                  ? 'Медленнее среднего'
                                                  : 'Средняя скорость'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sm={4}
                            >
                                <Card variant='outlined'>
                                    <CardContent>
                                        <Typography
                                            variant='body2'
                                            color='text.secondary'
                                        >
                                            Задач в анализе
                                        </Typography>
                                        <Typography variant='h5'>
                                            {accuracyTrend.reduce(
                                                (sum, m) =>
                                                    sum +
                                                    (m.estimatedHours ? 1 : 0),
                                                0,
                                            )}
                                        </Typography>
                                        <Typography
                                            variant='caption'
                                            color='text.secondary'
                                        >
                                            Последние 20 задач
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sm={4}
                            >
                                <Card variant='outlined'>
                                    <CardContent>
                                        <Typography
                                            variant='body2'
                                            color='text.secondary'
                                        >
                                            Статус обучения
                                        </Typography>
                                        <Typography
                                            variant='h5'
                                            color='success.main'
                                        >
                                            Активно
                                        </Typography>
                                        <Typography
                                            variant='caption'
                                            color='text.secondary'
                                        >
                                            Обновляется автоматически
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
