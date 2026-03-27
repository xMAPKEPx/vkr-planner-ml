'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { createWorkLog } from '@/store/slices/workLogSlice';
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    Typography,
} from '@mui/material';

interface Props {
    taskId: number;
    taskTitle: string;
    estimatedHours?: number | null;
    onClose: () => void;
}

export default function WorkLogForm({
    taskId,
    taskTitle,
    estimatedHours,
    onClose,
}: Props) {
    const dispatch = useAppDispatch();
    const [hours, setHours] = useState<string>('');
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const hoursNum = parseFloat(hours);
        if (isNaN(hoursNum) || hoursNum <= 0) {
            setError('Введите корректное количество часов');
            return;
        }

        setLoading(true);
        try {
            await dispatch(
                createWorkLog({ taskId, hours: hoursNum, comment }),
            ).unwrap();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to log work');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>⏱️ Записать время</DialogTitle>

            <DialogContent>
                {error && (
                    <Alert
                        severity='error'
                        sx={{ mb: 2 }}
                    >
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant='subtitle2'
                        color='text.secondary'
                    >
                        Задача:
                    </Typography>
                    <Typography variant='body1'>{taskTitle}</Typography>
                </Box>

                {estimatedHours && (
                    <Box
                        sx={{
                            mb: 2,
                            p: 2,
                            bgcolor: 'background.default',
                            borderRadius: 1,
                        }}
                    >
                        <Typography
                            variant='body2'
                            color='text.secondary'
                        >
                            📊 Прогноз: <strong>{estimatedHours} ч.</strong>
                        </Typography>
                        <Typography
                            variant='caption'
                            color='text.secondary'
                        >
                            Сравним с фактическим временем для улучшения
                            прогнозов
                        </Typography>
                    </Box>
                )}

                <TextField
                    fullWidth
                    label='Фактическое время (часы)'
                    type='number'
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    margin='normal'
                    required
                    inputProps={{ step: 0.5, min: 0.5 }}
                    placeholder='Например: 2.5'
                />

                <TextField
                    fullWidth
                    label='Комментарий'
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    margin='normal'
                    multiline
                    rows={2}
                    placeholder='Что было сделано?'
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button
                    type='submit'
                    variant='contained'
                    disabled={loading}
                >
                    {loading ? 'Сохранение...' : 'Записать'}
                </Button>
            </DialogActions>
        </form>
    );
}
