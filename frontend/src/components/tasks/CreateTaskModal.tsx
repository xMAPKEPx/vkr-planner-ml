'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { X, Sparkles, Type, Calendar, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  teamId: string;
  members: Member[];
}

interface Team {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  projects: Project[];
}

interface ContextState {
  context: 'personal' | 'project';
  currentTeamId: string | null;
  currentProjectId: string | null;
  teams: Team[];
}

interface TaskData {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  assignee?: string | null;
  subtasks?: string[];
  mode: 'manual' | 'ai';
  aiGenerated?: boolean;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: TaskData) => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  const { context, currentProjectId, teams } = useAppSelector(
    (state) => state.context as ContextState
  );

  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  
  // States for manual mode
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>(['']);

  // State for AI mode
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Get current project members
  const currentProject = teams
    .flatMap((t) => t.projects)
    .find((p) => p.id === currentProjectId);

  const members = currentProject?.members || [];

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, '']);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  const handleManualSubmit = () => {
    const task: TaskData = {
      title,
      description,
      startDate,
      endDate,
      assignee: context === 'project' ? assignee : null,
      subtasks: subtasks.filter((s) => s.trim() !== ''),
      mode: 'manual',
    };
    onSubmit(task);
    resetForm();
  };

  const handleAISubmit = async () => {
    setIsGenerating(true);
    // Здесь будет вызов API для NLP обработки
    setTimeout(() => {
      setIsGenerating(false);
      const task: TaskData = {
        title: aiPrompt,
        description: aiPrompt,
        mode: 'ai',
        aiGenerated: true,
      };
      onSubmit(task);
      resetForm();
    }, 1500);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setAssignee('');
    setSubtasks(['']);
    setAiPrompt('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-150 bg-white dark:bg-gray-900">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Создать задачу
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'manual' | 'ai')}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger
              value="manual"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              <Type className="w-4 h-4" />
              Ручной ввод
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              <Sparkles className="w-4 h-4" />
              AI разбор (NLP)
            </TabsTrigger>
          </TabsList>

          {/* Manual Mode */}
          <TabsContent value="manual" className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Название задачи *
              </label>
              <Input
                placeholder="Введите название задачи"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Описание
              </label>
              <Textarea
                placeholder="Опишите задачу подробнее"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Начало
                </label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Окончание
                </label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Assignee selector - only in project context */}
            {context === 'project' && members.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Исполнитель
                </label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue placeholder="Выберите исполнителя" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subtasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Подзадачи
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubtask}
                  className="text-sm"
                >
                  + Добавить
                </Button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Подзадача ${index + 1}`}
                      value={subtask}
                      onChange={(e) =>
                        handleSubtaskChange(index, e.target.value)
                      }
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                    {subtasks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSubtask(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button
                onClick={handleManualSubmit}
                disabled={!title.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Сохранить задачу
              </Button>
            </div>
          </TabsContent>

          {/* AI Mode */}
          <TabsContent value="ai" className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Опишите задачу своими словами
              </label>
              <Textarea
                placeholder="Например: 'Нужно сделать авторизацию через Google и подключить базу данных до пятницы'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={6}
                className="dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Система автоматически разобьет задачу на подзадачи, оценит время
                и предложит оптимальное расписание
              </p>
            </div>

            {/* Assignee selector for AI mode - only in project context */}
            {context === 'project' && members.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Исполнитель
                </label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue placeholder="Кому назначить задачу?" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button
                onClick={handleAISubmit}
                disabled={!aiPrompt.trim() || isGenerating}
                className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Сгенерировать план
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}