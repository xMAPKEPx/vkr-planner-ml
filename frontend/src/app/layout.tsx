// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import Registry from '@/components/providers/Registry';

export const metadata: Metadata = {
  title: 'ВКР: Task Tracker with AI',
  description: 'Task tracker с машинным обучением и self-finetuning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Registry>
          {children}
        </Registry>
      </body>
    </html>
  );
}