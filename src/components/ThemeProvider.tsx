'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';

// Inner component to sync theme with database
function ThemeSyncer() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const lastSavedTheme = React.useRef<string | null>(null);

  // Load theme from database on mount
  React.useEffect(() => {
    if (!user || hasLoaded) return;

    const loadTheme = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          const dbTheme = settings?.branding?.theme;
          if (dbTheme && dbTheme !== theme) {
            setTheme(dbTheme);
            lastSavedTheme.current = dbTheme;
          }
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setHasLoaded(true);
      }
    };

    loadTheme();
  }, [user, hasLoaded, setTheme, theme]);

  // Save theme to database when it changes
  React.useEffect(() => {
    if (!user || !hasLoaded || !theme) return;
    if (lastSavedTheme.current === theme) return;

    const saveTheme = async () => {
      try {
        // Get CSRF token
        const csrfResponse = await fetch('/api/csrf');
        const { csrfToken } = await csrfResponse.json();

        await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ theme }),
        });
        lastSavedTheme.current = theme;
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    };

    // Debounce the save to avoid too many API calls
    const timeoutId = setTimeout(saveTheme, 500);
    return () => clearTimeout(timeoutId);
  }, [user, hasLoaded, theme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSyncer />
      {children}
    </NextThemesProvider>
  );
}
