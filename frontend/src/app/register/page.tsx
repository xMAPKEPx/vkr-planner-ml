'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, type RegisterData } from '@/lib/api';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Link as MuiLink,
} from '@mui/material';
import NextLink from 'next/link';

export default function RegisterPage() {
    const router = useRouter();

    const [formData, setFormData] = useState<RegisterData>({
        email: '',
        password: '',
        name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const validateForm = (): string | null => {
        if (!formData.email.trim()) return 'Введите email';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            return 'Некорректный формат email';
        }
        if (!formData.password) return 'Введите пароль';
        if (formData.password.length < 6) {
            return 'Пароль должен содержать минимум 6 символов';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // ✅ Регистрация: возвращает токен и данные пользователя
            const response = await authAPI.register(formData);

            if (!response?.token) {
                throw new Error('Регистрация успешна, но токен не получен');
            }

            setSuccess(true);
            
            // ✅ Сохраняем токен (интерцептор axios подхватит его)
            localStorage.setItem('auth_token', response.token);
            
            // ✅ Редирект на дашборд через небольшую задержку
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);

        } catch (err: any) {
            console.error('Register error:', err);
            
            setError(
                err.response?.data?.error || 
                err.response?.data?.message ||
                err.message || 
                'Ошибка регистрации. Попробуйте другой email.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof RegisterData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        // Очищаем ошибку при изменении поля
        if (error) setError('');
    };

    return (
        <Container maxWidth='sm' sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant='h4' align='center' gutterBottom>
                    🎓 Регистрация
                </Typography>
                <Typography variant='subtitle1' align='center' color='text.secondary' gutterBottom>
                    Создайте аккаунт в ВКР Task Tracker
                </Typography>

                {error && (
                    <Alert severity='error' sx={{ mt: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity='success' sx={{ mt: 2 }}>
                        ✅ Регистрация успешна! Перенаправляем...
                    </Alert>
                )}

                <Box component='form' onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        fullWidth
                        label='Имя (опционально)'
                        value={formData.name}
                        onChange={handleChange('name')}
                        margin='normal'
                        disabled={loading || success}
                    />
                    <TextField
                        fullWidth
                        label='Email'
                        type='email'
                        value={formData.email}
                        onChange={handleChange('email')}
                        margin='normal'
                        required
                        disabled={loading || success}
                        error={!!error && !formData.email}
                    />
                    <TextField
                        fullWidth
                        label='Пароль'
                        type='password'
                        value={formData.password}
                        onChange={handleChange('password')}
                        margin='normal'
                        required
                        disabled={loading || success}
                        helperText="Минимум 6 символов"
                        error={!!error && !formData.password}
                    />
                    <Button
                        type='submit'
                        fullWidth
                        variant='contained'
                        size='large'
                        disabled={loading || success}
                        sx={{ mt: 3 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
                    </Button>

                    <Typography align='center' sx={{ mt: 2 }}>
                        Уже есть аккаунт?{' '}
                        <NextLink href='/login' passHref legacyBehavior>
                            <MuiLink>Войти</MuiLink>
                        </NextLink>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}