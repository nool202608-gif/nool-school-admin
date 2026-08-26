'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { ReactNode } from 'react';

import { muiTheme } from './muiTheme';

/** Client boundary for MUI's ThemeProvider - kept out of the (server)
 * root layout so that file doesn't need 'use client' itself.
 * AppRouterCacheProvider registers Emotion's inserted <style> tags with
 * Next's streaming-SSR insertion point so the client's first render
 * matches the server's byte-for-byte - without it, MUI/Emotion's global
 * style tag lands in a different spot on the client than on the server
 * and React logs a hydration mismatch on every page. */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
