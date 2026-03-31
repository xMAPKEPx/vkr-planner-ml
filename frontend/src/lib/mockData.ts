import type { DashboardStats, AccuracyTrend, CategoryStats } from '@/types';

export const mockDashboardStats: DashboardStats = {
  totalTasks: 45,
  completedTasks: 32,
  totalHours: 128.5,
  avgAccuracy: 0.78,
  speedFactor: 1.15,
  tasksOnTime: 28,
  tasksLate: 4,
};

export const mockAccuracyTrend: AccuracyTrend[] = [
  { month: 'Янв', accuracy: 0.65, estimatedHours: 40, actualHours: 45 },
  { month: 'Фев', accuracy: 0.72, estimatedHours: 38, actualHours: 40 },
  { month: 'Мар', accuracy: 0.78, estimatedHours: 42, actualHours: 41 },
  { month: 'Апр', accuracy: 0.81, estimatedHours: 35, actualHours: 34 },
  { month: 'Май', accuracy: 0.85, estimatedHours: 40, actualHours: 38 },
];

export const mockCategoryStats: CategoryStats[] = [
  { category: 'Разработка', count: 20, avgEstimatedHours: 8.5, avgActualHours: 9.2, accuracy: 0.82 },
  { category: 'Тестирование', count: 12, avgEstimatedHours: 4.0, avgActualHours: 4.5, accuracy: 0.75 },
  { category: 'Документация', count: 8, avgEstimatedHours: 3.5, avgActualHours: 5.0, accuracy: 0.65 },
  { category: 'Встречи', count: 5, avgEstimatedHours: 2.0, avgActualHours: 2.2, accuracy: 0.88 },
];