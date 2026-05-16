// frontend/src/types/index.ts

export interface User {
  id: number; // 🔥 Число, как в БД
  name: string;
  email: string;
  speedFactor?: number;
  accuracy?: number;
  role?: 'USER' | 'TEAM_LEAD' | 'ADMIN';
}

// 🔥 Единый тип для задач и подзадач (как в БД)
export interface Task {
  id: number; // 🔥 Число, как в БД
  title: string;
  description?: string;
  estimatedDuration: number; // Плановое время (минуты)
  actualDuration?: number;   // Фактическое время (минуты)
  startDate: string; // ISO 8601
  endDate: string;
  status: 'todo' | 'in_progress' | 'done';
  userId: number; // 🔥 Число
  assignee?: number | null; // 🔥 Число или null
  projectId?: number | null;
  categoryId?: number | null;
  
  // 🔥 Иерархия задач (WBS)
  parentId?: number | null; // Если есть — это подзадача
  subtasks?: Task[];        // Рекурсивная ссылка
  
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt?: string;
  updatedAt?: string;
}

// 🔥 Subtask — это просто алиас Task (в БД это одна сущность)
export type Subtask = Task;

// WorkLog - основа для self-finetuning (ВКР п. 3.3.1)
export interface WorkLogEntry {
  taskId: number; // 🔥 Число
  userId: number;
  plannedDuration: number;
  actualDuration: number;
  completedAt: string; // 🔥 ISO string для сериализации
  category?: string;
}

export interface Project {
  id: number;
  name: string;
  teamId: number;
  members: User[];
  tasks: Task[];
}

export interface Team {
  id: number;
  name: string;
  color: string;
  isVisible: boolean;
  projects: Project[];
}