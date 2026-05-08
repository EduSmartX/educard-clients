/**
 * Shared framer-motion animation variants & constants.
 * Import from '@/lib/motion' in any component that needs consistent animations.
 */

/** Stagger children by 80ms each */
export const STAGGER_CHILDREN = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

/** Fade up 24px with a smooth ease */
export const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;

/** Fade in from the left */
export const FADE_LEFT = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;

/** Scale-in with spring bounce (good for icons / numbers) */
export const SCALE_IN = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, type: 'spring' as const, bounce: 0.3 },
  },
} as const;

/** Standard page container wrapper */
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
} as const;

/** Card-level hover lift */
export const CARD_HOVER = {
  whileHover: { y: -4, scale: 1.02 },
  whileTap: { scale: 0.98 },
} as const;

/** Subtle list-item slide */
export const LIST_ITEM_SLIDE = {
  hidden: { opacity: 0, x: -16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35 },
  },
} as const;

/** Time-aware greeting helper */
export function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) {
    return { text: 'Good Morning', emoji: '☀️' };
  }
  if (h < 17) {
    return { text: 'Good Afternoon', emoji: '🌤️' };
  }
  return { text: 'Good Evening', emoji: '🌙' };
}
