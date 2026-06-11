// ============================================================
// haptics.ts
// Lightweight wrapper around the Vibration API for tactile
// feedback on touch devices. No-ops where unsupported (most
// desktops, iOS Safari) so callers never need to guard.
// ============================================================

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light:   8,
  medium:  14,
  heavy:   22,
  success: [10, 40, 16],
  warning: [16, 60, 16],
};

/**
 * Trigger a haptic pulse. Safe to call anywhere — silently does
 * nothing when the Vibration API is unavailable or the user has
 * reduced-motion enabled.
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (typeof window === 'undefined') return;
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') return;

  // Respect users who opt out of motion/animation.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* some browsers throw when called outside a user gesture — ignore */
  }
}
