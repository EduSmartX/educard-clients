import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AttendanceStats {
  total_working_days: number;
  total_present: number;
  total_absent: number;
  total_leaves: number;
  total_holidays: number;
}

function DonutChart({ stats }: Readonly<{ stats: AttendanceStats }>) {
  const present = stats.total_present || 0;
  const absent = stats.total_absent || 0;
  const leaves = stats.total_leaves || 0;
  const total = present + absent + leaves;

  if (total === 0) {
    return <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />;
  }

  const circumference = 2 * Math.PI * 40;
  const presentLength = (present / total) * circumference;
  const absentLength = (absent / total) * circumference;
  const leaveLength = (leaves / total) * circumference;

  return (
    <>
      {present > 0 && (
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#22c55e"
          strokeWidth="20"
          strokeDasharray={`${presentLength} ${circumference - presentLength}`}
          strokeDashoffset={0}
        />
      )}
      {absent > 0 && (
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#ef4444"
          strokeWidth="20"
          strokeDasharray={`${absentLength} ${circumference - absentLength}`}
          strokeDashoffset={-presentLength}
        />
      )}
      {leaves > 0 && (
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#f97316"
          strokeWidth="20"
          strokeDasharray={`${leaveLength} ${circumference - leaveLength}`}
          strokeDashoffset={-(presentLength + absentLength)}
        />
      )}
    </>
  );
}

export function AttendanceInsightsPanel({ stats }: Readonly<{ stats: AttendanceStats }>) {
  const overallPercent =
    stats.total_working_days > 0
      ? Math.round((stats.total_present / stats.total_working_days) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Attendance Distribution</CardTitle>
          <p className="text-xs text-gray-600">Overall: {overallPercent}%</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative mb-4 h-48 w-48">
            <svg viewBox="0 0 100 100" className="-rotate-90 transform">
              <DonutChart stats={stats} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{overallPercent}%</div>
                <div className="mt-1 text-xs text-gray-600">Present</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-700">Present</span>
              </div>
              <span className="text-xs font-semibold text-gray-900">{stats.total_present}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-700">Absent</span>
              </div>
              <span className="text-xs font-semibold text-gray-900">{stats.total_absent}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-700">Leave</span>
              </div>
              <span className="text-xs font-semibold text-gray-900">{stats.total_leaves}</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="mb-1 text-[10px] font-medium text-green-700">Present</div>
              <div className="text-xl font-bold text-green-900">{stats.total_present}</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="mb-1 text-[10px] font-medium text-red-700">Absent</div>
              <div className="text-xl font-bold text-red-900">{stats.total_absent}</div>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="mb-1 text-[10px] font-medium text-orange-700">Leaves</div>
              <div className="text-xl font-bold text-orange-900">{stats.total_leaves}</div>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
              <div className="mb-1 text-[10px] font-medium text-purple-700">Holidays</div>
              <div className="text-xl font-bold text-purple-900">{stats.total_holidays}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Legend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
              ✓
            </div>
            <span className="text-gray-700">Present</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              ✕
            </div>
            <span className="text-gray-700">Absent</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
              ✕
            </div>
            <span className="text-gray-700">Leave (Approved)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-4 w-4 rounded border border-purple-300 bg-purple-100"></div>
            <span className="text-gray-700">Holiday</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
