import { AlertTriangle, Lightbulb, MessageCircle, TrendingUp, type LucideIcon } from 'lucide-react';
import type { FeedbackTypeIconName } from '@educard/shared';

/** Maps the shared icon name onto the web icon set (mobile maps the same names). */
export const FEEDBACK_TYPE_ICONS: Record<FeedbackTypeIconName, LucideIcon> = {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
};
