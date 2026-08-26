import { useEffect } from 'react';

const FIELD_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

/** Gap kept between the focused field and the top of the on-screen keyboard. */
const KEYBOARD_GAP_PX = 24;

/** The visual viewport shrinks by at least this ratio when a keyboard opens. */
const KEYBOARD_OPEN_RATIO = 0.85;

/** Mobile browsers settle the viewport only after the keyboard finishes animating. */
const SETTLE_DELAY_MS = 150;

/**
 * Keeps the focused form field visible above the on-screen keyboard on mobile browsers.
 * Desktop browsers report no viewport shrink, so this stays inert there.
 */
export function useKeyboardFieldVisibility() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    let timer: number | undefined;

    const revealFocusedField = () => {
      const field = document.activeElement;
      if (!(field instanceof HTMLElement) || !field.matches(FIELD_SELECTOR)) {
        return;
      }

      const keyboardIsOpen = viewport.height < window.innerHeight * KEYBOARD_OPEN_RATIO;
      if (!keyboardIsOpen) {
        return;
      }

      const visibleBottom = viewport.offsetTop + viewport.height;
      const isHidden = field.getBoundingClientRect().bottom + KEYBOARD_GAP_PX > visibleBottom;
      if (isHidden) {
        field.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    };

    const scheduleReveal = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(revealFocusedField, SETTLE_DELAY_MS);
    };

    document.addEventListener('focusin', scheduleReveal);
    viewport.addEventListener('resize', scheduleReveal);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('focusin', scheduleReveal);
      viewport.removeEventListener('resize', scheduleReveal);
    };
  }, []);
}
