export interface User {
  id: string;
  name: string;
  email: string;
  speedFactor?: number; // Коэффициент скорости (из ВКР п. 3.3.1)
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  estimatedDuration: number; // Плановое время (минуты)
  actualDuration?: number;   // Фактическое время (минуты)
  startDate: string; // ISO 8601 date string
  endDate: string;
  status: 'todo' | 'in_progress' | 'done';
  userId: string;
  assignee?: string;
  projectId?: string;
  subtasks?: Subtask[];
  category?: string;
}

export interface Subtask {
  id: string;
  title: string;
  estimatedDuration: number;
  actualDuration?: number;
  status: 'todo' | 'done';
}

// WorkLog - основа для self-finetuning (ВКР п. 3.3.1)
export interface WorkLogEntry {
  taskId: string;
  userId: string;
  plannedDuration: number;  // t_plan
  actualDuration: number;   // t_fact
  completedAt: Date;
  category?: string;
}

export interface Project {
  id: string;
  name: string;
  teamId: string;
  members: User[];
  tasks: Task[];
}

export interface Team {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  projects: Project[];
}