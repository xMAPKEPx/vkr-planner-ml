'use client';

import { ReactNode, useState, useEffect } from 'react';
import ThemeProvider from './ThemeProvider';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { CssBaseline } from '@mui/material';

interface Props {
  children: ReactNode;
}

export default function Registry({ children }: Props) {
  // Fix for hydration mismatch with CSS
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // или лоадер
  }

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}