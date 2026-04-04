export type AppContextType = 'personal' | 'project';

export interface Team {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  teamId: string;
  members: User[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ContextState {
  context: AppContextType;
  currentTeamId: string | null;
  currentProjectId: string | null;
  teams: Team[];
}