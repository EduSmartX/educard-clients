import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AttendancePieChartProps {
  stats: {
    total_present?: number;
    total_absent?: number;
    total_leaves?: number;
    attendance_percentage?: number;
  };
  isLoading?: boolean;
}

const COLORS = {
  present: '#22c55e', // green-500
  absent: '#ef4444',   // red-500
  leave: '#f97316',    // orange-500
};

export function AttendancePieChart({ stats, isLoading = false }: AttendancePieChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPresent = stats.total_present || 0;
  const totalAbsent = stats.total_absent || 0;
  const totalLeaves = stats.total_leaves || 0;
  const total = totalPresent + totalAbsent + totalLeaves;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            No attendance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = [
    {
      name: 'Present',
      value: totalPresent,
      percentage: ((totalPresent / total) * 100).toFixed(1),
      color: COLORS.present,
    },
    {
      name: 'Absent',
      value: totalAbsent,
      percentage: ((totalAbsent / total) * 100).toFixed(1),
      color: COLORS.absent,
    },
    {
      name: 'Leave',
      value: totalLeaves,
      percentage: ((totalLeaves / total) * 100).toFixed(1),
      color: COLORS.leave,
    },
  ].filter(item => item.value > 0); // Only show segments with data

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percentage: string;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attendance Distribution</span>
          {stats.attendance_percentage !== undefined && (
            <span className="text-sm font-normal text-gray-600">
              Overall: {stats.attendance_percentage.toFixed(1)}%
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 shadow-lg rounded-lg border">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm text-gray-600">
                        Count: {data.value}
                      </p>
                      <p className="text-sm text-gray-600">
                        Percentage: {data.percentage}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              content={({ payload }) => {
                return (
                  <div className="flex justify-center gap-6 mt-4">
                    {payload?.map((entry, index) => (
                      <div key={`legend-${index}`} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-700">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
