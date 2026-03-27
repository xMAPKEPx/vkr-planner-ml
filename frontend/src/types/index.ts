export interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'USER' | 'TEAM_LEAD' | 'ADMIN';
  speedFactor: number;
  accuracy: number;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedHours: number | null;
  actualHours: number | null;
  dueDate: string | null;
  completedAt: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLog {
  id: number;
  taskId: number;
  userId: number;
  hours: number;
  comment: string | null;
  createdAt: string;
  task?: Task;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
}

export interface CreateWorkLogRequest {
  taskId: number;
  hours: number;
  comment?: string;
}