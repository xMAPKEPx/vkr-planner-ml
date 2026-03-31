import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Avatar,
} from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export default function Header() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        router.push('/login');
    };

    return (
        <AppBar
            position='static'
            color='default'
            elevation={1}
        >
            <Toolbar>
                <Typography
                    variant='h6'
                    sx={{ flexGrow: 1 }}
                >
                    🎓 ВКР Task Tracker
                </Typography>

                {isAuthenticated ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            color='inherit'
                            onClick={() => router.push('/dashboard')}
                        >
                            Статистика
                        </Button>
                        <Button
                            color='inherit'
                            onClick={() => router.push('/tasks')}
                        >
                            Задачи
                        </Button>
                        <Button
                            color='inherit'
                            onClick={() => router.push('/calendar')}
                        >
                            Календарь
                        </Button>
                        <Button
                            color='inherit'
                            onClick={() => router.push('/worklogs')}
                        >
                            История
                        </Button>
                        <Typography variant='body2'>
                            {user?.name || user?.email}
                        </Typography>
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'primary.main',
                            }}
                        >
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Button
                            color='inherit'
                            onClick={handleLogout}
                        >
                            Выход
                        </Button>
                    </Box>
                ) : (
                    <Button
                        color='inherit'
                        onClick={() => router.push('/login')}
                    >
                        Войти
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
}
