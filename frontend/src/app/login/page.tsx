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
    CircularProgress,
} from '@mui/material';
import Link from 'next/link';

export default function LoginPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // ✅ authAPI.login возвращает данные напрямую, не { data: ... }
            const response = await authAPI.login(formData);

            if (!response?.token) {
                throw new Error('Токен отсутствует в ответе сервера');
            }

            // ✅ Dispatch в Redux (проверь, что authSlice.login принимает такой формат)
            dispatch(login({
                token: response.token,
                user: response.user,
            }));

            // ✅ Редирект на дашборд
            router.push('/dashboard');
            // Или для полной перезагрузки: window.location.href = '/dashboard';

        } catch (err: any) {
            console.error('Login error:', err);
            
            setError(
                err.response?.data?.error || 
                err.response?.data?.message ||
                err.message || 
                'Ошибка входа. Проверьте данные.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth='sm' sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant='h4' align='center' gutterBottom>
                    🎓 ВКР Task Tracker
                </Typography>
                <Typography variant='subtitle1' align='center' color='text.secondary' gutterBottom>
                    Система с ИИ и self-finetuning
                </Typography>

                {error && (
                    <Alert severity='error' sx={{ mt: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Box component='form' onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        fullWidth
                        label='Email'
                        type='email'
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        margin='normal'
                        required
                        disabled={loading}
                    />
                    <TextField
                        fullWidth
                        label='Password'
                        type='password'
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        margin='normal'
                        required
                        disabled={loading}
                    />
                    <Button
                        type='submit'
                        fullWidth
                        variant='contained'
                        size='large'
                        disabled={loading}
                        sx={{ mt: 3 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Войти'}
                    </Button>

                    <Typography align='center' sx={{ mt: 2 }}>
                        Нет аккаунта?{' '}
                        <Link href='/register' style={{ textDecoration: 'underline' }}>
                            Регистрация
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}