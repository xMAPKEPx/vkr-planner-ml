// store/contextSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ContextState, AppContextType, Team } from '@/types/context';

const initialState: ContextState = {
  context: 'personal',
  currentTeamId: null,
  currentProjectId: null,
  teams: [], // Заполним моковыми данными позже
};

const contextSlice = createSlice({
  name: 'context',
  initialState,
  reducers: {
    setContext: (state, action: PayloadAction<AppContextType>) => {
      state.context = action.payload;
      if (action.payload === 'personal') {
        state.currentTeamId = null;
        state.currentProjectId = null;
      }
    },
    setCurrentProject: (state, action: PayloadAction<{ teamId: string; projectId: string }>) => {
      state.context = 'project';
      state.currentTeamId = action.payload.teamId;
      state.currentProjectId = action.payload.projectId;
    },
    toggleTeamVisibility: (state, action: PayloadAction<string>) => {
      const team = state.teams.find(t => t.id === action.payload);
      if (team) {
        team.isVisible = !team.isVisible;
      }
    },
    setTeams: (state, action: PayloadAction<Team[]>) => {
      state.teams = action.payload;
    },
  },
});

export const { setContext, setCurrentProject, toggleTeamVisibility, setTeams } = contextSlice.actions;
export default contextSlice.reducer;