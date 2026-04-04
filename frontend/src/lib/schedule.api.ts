import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const scheduleApi = {
  // Генерация вариантов расписания для задачи
  generateVariants: async (
    taskId: number,
    dueDate: string,
    startDate?: string
  ) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/tasks/${taskId}/schedule/generate`,
      { dueDate, startDate },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Принять вариант расписания
  acceptSchedule: async (variantId: string, slots: any[]) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/schedule/accept`,
      { variantId, slots },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Получить доступные стратегии
  getStrategies: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/schedule/strategies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};