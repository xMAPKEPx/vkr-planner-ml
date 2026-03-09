'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Container, Typography, Box, CircularProgress } from '@mui/material';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [mlStatus, setMlStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkServices = async () => {
      try {
        const backendRes = await api.get('/api/health');
        setBackendStatus(`Backend: ${backendRes.data.message}`);
      } catch (error) {
        setBackendStatus('Backend: ❌ Not available');
      }

      try {
        const mlRes = await fetch('http://localhost:8000/health');
        const mlData = await mlRes.json();
        setMlStatus(`ML-Core: ${mlData.service}`);
      } catch (error) {
        setMlStatus('ML-Core: ❌ Not available');
      }
    };

    checkServices();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🎓 ВКР: Task Tracker with AI
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Студент: Анемподистов
        </Typography>
        
        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            📊 Статус сервисов
          </Typography>
          <Typography>{backendStatus}</Typography>
          <Typography>{mlStatus}</Typography>
        </Box>
      </Box>
    </Container>
  );
}