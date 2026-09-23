/**
 * Leave Allocation Feature Banner Component
 */

import { CheckCircle2 } from 'lucide-react';

export function LeaveAllocationFeatureBanner() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="flex items-start">
        <div className="flex-1 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Smart Automation Enabled</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>
              Leave balances are <strong className="text-blue-700">automatically created</strong>{' '}
              for all staff and students when you add a new policy.
            </li>
            <li>Define the policy and select applicable roles.</li>
            <li>
              <span>The system instantly provisions leave balances—</span>
              <span className="font-medium text-green-700">zero manual work required!</span>
            </li>
          </ul>
          <div className="flex flex-col items-start gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="text-xs font-medium text-green-700">Role-based auto-assignment</span>
            </div>
            <span className="hidden text-gray-300 sm:inline">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="text-xs font-medium text-green-700">Instant balance creation</span>
            </div>
            <span className="hidden text-gray-300 sm:inline">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="text-xs font-medium text-green-700">No manual intervention</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
