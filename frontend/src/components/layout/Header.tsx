'use client';

import { useAppSelector } from '@/store/hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Header() {
  const { context, currentProjectId, teams } = useAppSelector((state) => state.context);

  const currentProject = teams
    .flatMap((t) => t.projects)
    .find((p) => p.id === currentProjectId);

  const title = context === 'personal' 
    ? 'Мое пространство' 
    : currentProject?.name || 'Проект';

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
          
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            Сегодня
          </button>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-700 rounded-md shadow-sm">
              Неделя
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
              День
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
              Месяц
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}