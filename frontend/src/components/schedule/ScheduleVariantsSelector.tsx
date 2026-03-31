import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { ScheduleVariantCard } from './ScheduleVariantCard';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ScheduleVariant } from '@/types/schedule';

interface Props {
  variants: ScheduleVariant[];
  recommendedVariantId: string;
  onAccept: (variant: ScheduleVariant) => void;
  onAdjust: (variant: ScheduleVariant) => void;
  onReject: () => void;
}

export const ScheduleVariantsSelector: React.FC<Props> = ({
  variants,
  recommendedVariantId,
  onAccept,
  onAdjust,
  onReject,
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(recommendedVariantId);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  if (!variants || variants.length === 0) {
    return (
      <Alert severity="warning">
        Не удалось сгенерировать варианты расписания. Попробуйте позже.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        🤖 ML предложил {variants.length} варианта расписания
      </Typography>

      {/* Карточки вариантов */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }}
        gap={2}
        mb={4}
      >
        {variants.map((variant) => (
          <ScheduleVariantCard
            key={variant.id}
            variant={variant}
            isSelected={variant.id === selectedVariantId}
            isRecommended={variant.id === recommendedVariantId}
            onSelect={setSelectedVariantId}
          />
        ))}
      </Box>

      {/* Детали выбранного расписания */}
      {selectedVariant && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            📋 Детали выбранного плана: {selectedVariant.name}
          </Typography>
          <ScheduleTimeline slots={selectedVariant.slots} />
        </Box>
      )}

      {/* Кнопки действий */}
      <Box display="flex" gap={2} justifyContent="center">
        <Button
          variant="outlined"
          color="error"
          onClick={onReject}
          size="large"
        >
          ❌ Отклонить все
        </Button>
        <Button
          variant="outlined"
          color="warning"
          onClick={() => selectedVariant && onAdjust(selectedVariant)}
          size="large"
        >
          ✏️ Скорректировать
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => selectedVariant && onAccept(selectedVariant)}
          size="large"
          disabled={!selectedVariant}
        >
          ✅ Принять расписание
        </Button>
      </Box>
    </Box>
  );
};