'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setTeams } from '@/store/slices/contextSlice';
import Sidebar from '@/components/layout/Sidebar';
import CalendarView from '@/components/schedule/CalendarView';
import Header from '@/components/layout/Header';

// Моковые данные для тестирования
const mockTeams = [
  {
    id: 'team-1',
    name: 'Frontend Team',
    color: '#3B82F6',
    isVisible: true,
    projects: [
      {
        id: 'proj-1',
        name: 'Редизайн сайта',
        teamId: 'team-1',
        members: [
          { id: 'user-1', name: 'Иван Иванов', email: 'ivan@test.com' },
          { id: 'user-2', name: 'Анна Петрова', email: 'anna@test.com' },
        ],
      },
      {
        id: 'proj-2',
        name: 'Мобильное приложение',
        teamId: 'team-1',
        members: [
          { id: 'user-1', name: 'Иван Иванов', email: 'ivan@test.com' },
        ],
      },
    ],
  },
  {
    id: 'team-2',
    name: 'Backend Team',
    color: '#10B981',
    isVisible: true,
    projects: [
      {
        id: 'proj-3',
        name: 'API v2',
        teamId: 'team-2',
        members: [
          { id: 'user-3', name: 'Петр Сидоров', email: 'petr@test.com' },
        ],
      },
    ],
  },
];

export default function DashboardPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setTeams(mockTeams));
  }, [dispatch]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <CalendarView />
        </main>
      </div>
    </div>
  );
}