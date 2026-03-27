'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createTask, updateTask, setSelectedTask } from '@/store/slices/taskSlice';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { api } from '@/lib/api';

interface Props {
  onClose: () => void;
}

export default function CreateTaskForm({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const selectedTask = useAppSelector((state) => state.tasks.selectedTask);
  const { loading } = useAppSelector((state) => state.tasks);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    dueDate: '',
  });
  
  const [mlPrediction, setMlPrediction] = useState<{
    predicted_hours: number;
    confidence: number;
  } | null>(null);
  
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');

  // Заполняем форму при редактировании
  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title,
        description: selectedTask.description || '',
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '',
      });
      setMlPrediction(null);
    }
  }, [selectedTask]);

  // Запрос к ML-Core для прогноза времени
  const fetchMLPrediction = async () => {
    if (!formData.title) return;
    
    setPredicting(true);
    try {
      const response = await api.post('http://localhost:8000/predict', {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      });
      setMlPrediction(response.data);
    } catch (err) {
      console.log('ML prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  // Авто-прогноз при изменении заголовка
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title && !selectedTask) {
        fetchMLPrediction();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.title, formData.priority]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (selectedTask) {
        await dispatch(updateTask({ id: selectedTask.id, data: formData })).unwrap();
      } else {
        await dispatch(createTask({
          ...formData,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        })).unwrap();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>
        {selectedTask ? 'Редактировать задачу' : 'Новая задача'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Название задачи"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Описание"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          margin="normal"
          multiline
          rows={3}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Приоритет</InputLabel>
          <Select
            value={formData.priority}
            label="Приоритет"
            onChange={(e) => setFormData({ 
              ...formData, 
              priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' 
            })}
          >
            <MenuItem value="LOW">🟢 Низкий</MenuItem>
            <MenuItem value="MEDIUM">🟡 Средний</MenuItem>
            <MenuItem value="HIGH">🔴 Высокий</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Срок выполнения"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />

        {/* ML Прогноз */}
        {!selectedTask && formData.title && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {predicting ? (
                <CircularProgress size={20} />
              ) : (
                <span>🤖</span>
              )}
              <Typography variant="body2" color="text.secondary">
                Прогноз времени: {predicting ? 'Загрузка...' : mlPrediction ? `${mlPrediction.predicted_hours} ч.` : '—'}
              </Typography>
            </Box>
            {mlPrediction && (
              <Typography variant="caption" color="text.secondary">
                Уверенность: {(mlPrediction.confidence * 100).toFixed(0)}%
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Сохранение...' : selectedTask ? 'Обновить' : 'Создать'}
        </Button>
      </DialogActions>
    </form>
  );
}