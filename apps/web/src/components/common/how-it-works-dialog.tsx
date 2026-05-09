/**
 * Reusable How It Works Dialog
 * A modular dialog component for displaying step-by-step instructions,
 * tips, and warnings throughout the application.
 */

import { Lightbulb, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HowItWorksStep {
  title: string;
  description: string | React.ReactNode;
  color?: 'blue' | 'indigo' | 'violet' | 'purple' | 'green' | 'amber' | 'rose';
}

export interface HowItWorksTip {
  title: string;
  description: string | React.ReactNode;
  type?: 'tip' | 'info';
}

export interface HowItWorksWarning {
  title: string;
  items: string[];
}

export interface HowItWorksDialogProps {
  /** Dialog title */
  title: string;
  /** Steps to display (numbered) */
  steps?: HowItWorksStep[];
  /** Tips to display (green checkmark) */
  tips?: HowItWorksTip[];
  /** Warnings to display (amber triangle) */
  warnings?: HowItWorksWarning[];
  /** Custom trigger button text */
  triggerText?: string;
  /** Show trigger text on mobile */
  showTriggerTextOnMobile?: boolean;
  /** Custom trigger button */
  customTrigger?: React.ReactNode;
}

// ── Color mapping ────────────────────────────────────────────────────────────

const stepColors = {
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
};

const defaultStepColors: Array<keyof typeof stepColors> = [
  'blue',
  'indigo',
  'violet',
  'purple',
  'green',
  'amber',
  'rose',
];

// ── Component ────────────────────────────────────────────────────────────────

export function HowItWorksDialog({
  title,
  steps = [],
  tips = [],
  warnings = [],
  triggerText = 'How it works',
  showTriggerTextOnMobile = false,
  customTrigger,
}: HowItWorksDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {customTrigger || (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 shadow-sm hover:bg-amber-100"
          >
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className={cn(showTriggerTextOnMobile ? '' : 'hidden sm:inline')}>
              {triggerText}
            </span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Lightbulb className="h-4 w-4 text-amber-600" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Steps */}
          {steps.map((step, index) => {
            const color = step.color || defaultStepColors[index % defaultStepColors.length];
            return (
              <div key={index} className="flex gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    stepColors[color]
                  )}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                  <div className="mt-0.5 text-sm text-slate-500">{step.description}</div>
                </div>
              </div>
            );
          })}

          {/* Tips */}
          {tips.map((tip, index) => (
            <div key={index} className="flex gap-2 rounded-xl bg-green-50 px-3 py-3">
              {tip.type === 'info' ? (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              )}
              <div>
                <p className={cn(
                  'text-xs font-semibold',
                  tip.type === 'info' ? 'text-blue-700' : 'text-green-700'
                )}>
                  {tip.title}
                </p>
                <div className={cn(
                  'mt-0.5 text-xs',
                  tip.type === 'info' ? 'text-blue-600' : 'text-green-600'
                )}>
                  {tip.description}
                </div>
              </div>
            </div>
          ))}

          {/* Warnings */}
          {warnings.map((warning, index) => (
            <div key={index} className="flex gap-2 rounded-xl bg-amber-50 px-3 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-xs font-semibold text-amber-700">{warning.title}</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-amber-600">
                  {warning.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default HowItWorksDialog;
