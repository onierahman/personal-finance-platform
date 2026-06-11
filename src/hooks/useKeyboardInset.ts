'use client';
import { useEffect, useState } from 'react';

/**
 * Tracks how many pixels the on-screen keyboard currently overlaps the
 * bottom of the layout viewport, using the VisualViewport API.
 *
 * On iOS/Android the software keyboard shrinks the visual viewport without
 * resizing the layout viewport, so a fixed bottom sheet would sit *behind*
 * the keyboard. Add the returned value as bottom padding / translate to
 * keep the active input visible.
 *
 * Returns 0 on platforms without VisualViewport (e.g. most desktops).
 */
export function useKeyboardInset(enabled = true): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = enabled && typeof window !== 'undefined' ? window.visualViewport : null;
    // When disabled (or unsupported) we simply stop tracking. The last value is
    // never read while disabled — the consumer only applies the inset while the
    // sheet is open — so there's no need to synchronously reset state here.
    if (!vv) return;

    function update() {
      const view = window.visualViewport;
      if (!view) return;
      // Gap between the layout viewport bottom and the visual viewport bottom.
      const overlap = window.innerHeight - view.height - view.offsetTop;
      setInset(overlap > 0 ? overlap : 0);
    }

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return inset;
}
