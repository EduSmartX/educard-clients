/**
 * Exceptional Work Policy Page
 * Main page for managing calendar exceptions (Force Working/Force Holiday)
 */

import { ExceptionalWorkManagement } from '@/features/exceptional-work/components';

export default function ExceptionalWorkPage() {
  return (
    <div className="container mx-auto">
      <ExceptionalWorkManagement />
    </div>
  );
}
