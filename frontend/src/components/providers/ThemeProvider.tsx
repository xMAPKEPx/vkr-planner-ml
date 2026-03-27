'use client';

import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { theme } from '@/app/theme';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function ThemeProvider({ children }: Props) {
  return (
    <MUIThemeProvider theme={theme}>
      {children}
    </MUIThemeProvider>
  );
}