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
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>
              Leave balances are <strong className="text-blue-700">automatically created</strong>{' '}
              for all staff and students when you add a new policy.
            </li>
            <li>Define the policy and select applicable roles.</li>
            <li>
              The system instantly provisions leave balances—
              <span className="text-green-700 font-medium">zero manual work required!</span>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-x-4 sm:gap-y-2 pt-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-xs font-medium text-green-700">Role-based auto-assignment</span>
            </div>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-xs font-medium text-green-700">Instant balance creation</span>
            </div>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-xs font-medium text-green-700">No manual intervention</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
