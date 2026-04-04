'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setContext, setCurrentProject, toggleTeamVisibility } from '@/store/slices/contextSlice';
import { ChevronDown, ChevronRight, Plus, Home, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const { context, currentProjectId, teams } = useAppSelector((state) => state.context);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const handleProjectClick = (teamId: string, projectId: string) => {
    dispatch(setCurrentProject({ teamId, projectId }));
  };

  const handlePersonalClick = () => {
    dispatch(setContext('personal'));
  };

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
    dispatch(toggleTeamVisibility(teamId));
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full flex flex-col">
      {/* Кнопка Создать */}
      <div className="p-4">
        <button className="flex items-center gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all p-3 rounded-xl w-full border border-gray-200 dark:border-gray-700">
          <Plus className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-700 dark:text-gray-200">Создать</span>
        </button>
      </div>

      {/* Мини-календарь */}
      <div className="px-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold dark:text-gray-200">Апрель 2026</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Здесь можно добавить полноценный мини-календарь */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            📅 Календарь
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Личное пространство */}
        <button
          onClick={handlePersonalClick}
          className={cn(
            'flex items-center gap-2 p-2 w-full rounded-lg transition-colors mb-2',
            context === 'personal'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          )}
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Мое пространство</span>
        </button>

        {/* Команды */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 mb-2">
            Команды
          </h3>
          
          {teams.map((team) => (
            <div key={team.id} className="mb-2">
              {/* Заголовок команды */}
              <button
                onClick={() => toggleTeam(team.id)}
                className="flex items-center gap-1 p-2 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {expandedTeams.has(team.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <Briefcase className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 text-left">
                  {team.name}
                </span>
              </button>

              {/* Проекты команды */}
              {expandedTeams.has(team.id) && (
                <div className="ml-6 mt-1 space-y-1">
                  {team.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(team.id, project.id)}
                      className={cn(
                        'flex items-center gap-2 p-2 w-full rounded-lg transition-colors text-sm',
                        currentProjectId === project.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      )}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="flex-1 text-left">{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}