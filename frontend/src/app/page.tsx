'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Container, Typography, Box, Button } from '@mui/material';

export default function Home() {
    const router = useRouter();
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    return (
        <Container
            maxWidth='md'
            sx={{ mt: 8, textAlign: 'center' }}
        >
            <Typography
                variant='h3'
                gutterBottom
            >
                🎓 ВКР: Task Tracker with AI
            </Typography>
            <Typography
                variant='h6'
                color='text.secondary'
                gutterBottom
            >
                Студент: Анемподистов А.И.
            </Typography>
            <Typography
                variant='body1'
                sx={{ mt: 4 }}
            >
                Интеллектуальная система поддержки принятия решений при
                постановке и планировании задач
            </Typography>
            <Box sx={{ mt: 4 }}>
                <Button
                    variant='contained'
                    size='large'
                    onClick={() => router.push('/login')}
                    sx={{ mr: 2 }}
                >
                    Войти
                </Button>
                <Button
                    variant='outlined'
                    size='large'
                    onClick={() => router.push('/register')}
                >
                    Регистрация
                </Button>
            </Box>
        </Container>
    );
}
