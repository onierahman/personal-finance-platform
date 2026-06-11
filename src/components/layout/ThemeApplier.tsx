'use client';
import { useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';

export function ThemeApplier() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return null;
}
