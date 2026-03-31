'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
} from '@mui/material';
import Link from 'next/link';

export default function LoginPage() {
    const dispatch = useAppDispatch();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => {
        console.log(`[Login Debug] ${msg}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        addLog('▶️ Начало входа');

        setLoading(true);
        setError('');

        addLog(`📧 Email: ${formData.email}`);
        addLog('📡 Отправка запроса к API...');

        try {
            const { data } = await authAPI.login(formData);
            addLog(`✅ Ответ получен: ${JSON.stringify(data.user)}`);

            if (!data?.token) {
                throw new Error('Токен отсутствует в ответе');
            }

            addLog('🔄 Dispatch login...');
            dispatch(login(data));
            addLog('✅ Redux обновлён');

            addLog('🔁 Редирект на /dashboard через window.location.href');

            // ✅ Критично: НЕ используем router.push()
            window.location.href = '/dashboard';

            // ✅ Явный return
            addLog('✅ Функция завершена (return)');
            return;
        } catch (err: any) {
            addLog(`❌ ОШИБКА: ${err.message}`);
            addLog(`📊 Status: ${err.response?.status}`);
            addLog(`📦 Response: ${JSON.stringify(err.response?.data)}`);

            setError(
                err.response?.data?.error || err.message || 'Ошибка входа',
            );

            // ✅ НЕ редиректим!
            addLog('⛔ Редирект ОТМЕНЁН (ошибка)');
        } finally {
            setLoading(false);
            addLog('🏁 Finally block (loading = false)');
        }
    };

    return (
        <Container
            maxWidth='sm'
            sx={{ mt: 8 }}
        >
            <Paper
                elevation={3}
                sx={{ p: 4 }}
            >
                <Typography
                    variant='h4'
                    align='center'
                    gutterBottom
                >
                    🎓 ВКР Task Tracker
                </Typography>
                <Typography
                    variant='subtitle1'
                    align='center'
                    color='text.secondary'
                    gutterBottom
                >
                    Система с ИИ и self-finetuning
                </Typography>

                {error && (
                    <Alert
                        severity='error'
                        sx={{ mt: 2 }}
                    >
                        {error}
                    </Alert>
                )}

                {/* 🔍 Debug панель - удалишь после отладки
                {debugLog.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                        <Typography variant='caption' fontWeight='bold'>Debug Log:</Typography>
                        {debugLog.map((log, i) => (
                            <Typography key={i} variant='caption' display='block'>{log}</Typography>
                        ))}
                    </Box>
                )} */}

                <Box
                    component='form'
                    onSubmit={handleSubmit}
                    sx={{ mt: 3 }}
                >
                    <TextField
                        fullWidth
                        label='Email'
                        type='email'
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        margin='normal'
                        required
                    />
                    <TextField
                        fullWidth
                        label='Password'
                        type='password'
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                password: e.target.value,
                            })
                        }
                        margin='normal'
                        required
                    />
                    <Button
                        type='submit'
                        fullWidth
                        variant='contained'
                        size='large'
                        disabled={loading}
                        sx={{ mt: 3 }}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </Button>

                    <Typography
                        align='center'
                        sx={{ mt: 2 }}
                    >
                        Нет аккаунта?{' '}
                        <Link
                            href='/register'
                            style={{ textDecoration: 'underline' }}
                        >
                            Регистрация
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
