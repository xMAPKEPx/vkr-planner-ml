'use client';

import { ReactNode, useState, useEffect } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { CssBaseline } from '@mui/material';
import ThemeProvider from './ThemeProvider';
import ReduxProvider from './ReduxProvider';

interface Props {
  children: ReactNode;
}

export default function Registry({ children }: Props) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ReduxProvider>
        <ThemeProvider>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ReduxProvider>
    </AppRouterCacheProvider>
  );
}