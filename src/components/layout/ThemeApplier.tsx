'use client';
import { useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';

// Apply theme from localStorage immediately on first paint to avoid flash
if (typeof window !== 'undefined') {
  try {
    const stored = JSON.parse(localStorage.getItem('ui-theme') ?? '{}');
    if (stored?.state?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch {
    // ignore parse errors
  }
}

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
