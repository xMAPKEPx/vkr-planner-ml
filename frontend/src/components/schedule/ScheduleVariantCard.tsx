import React from 'react';
import { Card, CardContent, CardActions, Typography, Chip, Box, Rating } from '@mui/material';
import { ScheduleVariant } from '@/types/schedule';

interface Props {
  variant: ScheduleVariant;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: (variantId: string) => void;
}

export const ScheduleVariantCard: React.FC<Props> = ({
  variant,
  isSelected,
  isRecommended,
  onSelect,
}) => {
  // Иконка и цвета для стратегии
  const getStrategyStyle = (name: string) => {
    switch (name) {
      case 'Спринтер':
        return { icon: '🏃', color: '#ff5722', bg: '#ffebee' };
      case 'Равномерная нагрузка':
        return { icon: '⚖️', color: '#4caf50', bg: '#e8f5e9' };
      case 'Критический путь':
        return { icon: '🎯', color: '#2196f3', bg: '#e3f2fd' };
      default:
        return { icon: '📋', color: '#757575', bg: '#f5f5f5' };
    }
  };

  const style = getStrategyStyle(variant.name);
  const riskColor = variant.metrics.riskScore > 0.6 ? 'error' : variant.metrics.riskScore > 0.3 ? 'warning' : 'success';

  return (
    <Card
      sx={{
        border: isSelected ? '3px solid #1976d2' : '1px solid #e0e0e0',
        bgcolor: isSelected ? style.bg : 'white',
        transition: 'all 0.3s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
      }}
      onClick={() => onSelect(variant.id)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            {style.icon} {variant.name}
          </Typography>
          {isRecommended && (
            <Chip label="РЕКОМЕНДУЕТСЯ" color="primary" size="small" />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {variant.description}
        </Typography>

        {/* Метрики */}
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              ⏱️ Дней
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {variant.metrics.totalDays}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              📊 Нагрузка/день
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {variant.metrics.avgLoadPerDay}ч
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              ⚠️ Риск
            </Typography>
            <Chip
              label={variant.metrics.riskScore.toFixed(2)}
              color={riskColor}
              size="small"
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              📅 Завершение
            </Typography>
            <Typography variant="body1" fontWeight="bold" fontSize="0.8rem">
              {new Date(variant.metrics.completionDate).toLocaleDateString('ru-RU')}
            </Typography>
          </Box>
        </Box>

        {/* Уверенность ML */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            Уверенность ML:
          </Typography>
          <Rating value={variant.confidence * 5} precision={0.5} readOnly size="small" />
        </Box>
      </CardContent>

      <CardActions>
        <Chip
          label={isSelected ? '✓ Выбрано' : 'Выбрать'}
          color={isSelected ? 'success' : 'default'}
          variant={isSelected ? 'filled' : 'outlined'}
          fullWidth
        />
      </CardActions>
    </Card>
  );
};