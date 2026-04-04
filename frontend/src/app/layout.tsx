import type { Metadata } from 'next';
import Registry from '@/components/providers/Registry';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css"; 

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="ru" className={cn("font-sans", geist.variable)}>
      <body>
        <Registry>
          {children}
        </Registry>
      </body>
    </html>
  );
}