'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { completeTask } from '@/store/slices/taskSlice';
import { Task, WorkLogEntry } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CompleteTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CompleteTaskModal({
  task,
  isOpen,
  onClose,
}: CompleteTaskModalProps) {
  const dispatch = useAppDispatch();
  const [actualDuration, setActualDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!task) return null;

  const handleSubmit = async () => {
    if (!actualDuration) return;

    setIsSubmitting(true);

    const workLog: WorkLogEntry = {
      taskId: task.id,
      userId: task.userId,
      plannedDuration: task.estimatedDuration,
      actualDuration: parseInt(actualDuration),
      completedAt: new Date(),
      category: task.category,
    };

    // Отправляем на "бэкенд" (пока моковый API)
    await dispatch(completeTask(workLog));

    setIsSubmitting(false);
    setActualDuration('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Завершение задачи</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold text-lg">{task.title}</h3>
            <p className="text-sm text-gray-500">{task.description}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="planned">Плановое время (минут)</Label>
            <Input
              id="planned"
              value={task.estimatedDuration}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="actual">Фактическое время (минут) *</Label>
            <Input
              id="actual"
              type="number"
              placeholder="Сколько реально потратили?"
              value={actualDuration}
              onChange={(e) => setActualDuration(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Эти данные будут использованы для самообучения системы
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!actualDuration || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Сохранение...' : 'Завершить задачу'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}