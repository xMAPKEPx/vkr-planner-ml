'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, Alert, CircularProgress, Stepper, Step, StepLabel } from '@mui/material';
import { scheduleApi } from '@/lib/api/schedule.api';
import { ScheduleVariantsSelector } from '@/components/schedule/ScheduleVariantsSelector';
import { ScheduleVariant } from '@/types/schedule';

export default function TaskPlanPage() {
  const params = useParams();
  const taskId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ScheduleVariant[]>([]);
  const [recommendedVariantId, setRecommendedVariantId] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Этапы процесса (Раздел 2.1.2 ВКР)
  const steps = ['Декомпозиция', 'Генерация расписаний', 'Выбор плана', 'Подтверждение'];

  useEffect(() => {
    generateSchedules();
  }, []);

  const generateSchedules = async () => {
    try {
      setLoading(true);
      // TODO: Получить дедлайн задачи из API
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await scheduleApi.generateVariants(taskId, dueDate);
      
      setVariants(response.variants);
      setRecommendedVariantId(response.recommendedVariantId);
      setCurrentStep(2); // Переход к шагу выбора
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка генерации расписания');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (variant: ScheduleVariant) => {
    try {
      await scheduleApi.acceptSchedule(variant.id, variant.slots);
      setCurrentStep(3);
      // TODO: Показать уведомление об успехе
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения расписания');
    }
  };

  const handleAdjust = (variant: ScheduleVariant) => {
    // TODO: Открыть редактор расписания
    console.log('Adjust variant:', variant);
  };

  const handleReject = () => {
    // TODO: Перейти к ручному созданию плана
    setCurrentStep(2);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" mt={3}>
          🤖 ML генерирует варианты расписания...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Это может занять до 30 секунд
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        📋 Планирование задачи #{taskId}
      </Typography>

      {/* Stepper процесса (Раздел 2.1.2) */}
      <Box mb={4}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Выбор варианта расписания (Раздел 2.1.5) */}
      {currentStep === 2 && (
        <ScheduleVariantsSelector
          variants={variants}
          recommendedVariantId={recommendedVariantId}
          onAccept={handleAccept}
          onAdjust={handleAdjust}
          onReject={handleReject}
        />
      )}

      {/* Подтверждение */}
      {currentStep === 3 && (
        <Alert severity="success">
          ✅ Расписание успешно сохранено! Вы можете начать выполнение задач.
        </Alert>
      )}
    </Container>
  );
}