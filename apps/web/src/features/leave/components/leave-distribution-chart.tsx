import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Label as RechartsLabel,
} from 'recharts';

interface PieChartEntry {
  name: string;
  value: number;
  color: string;
}

const RADIAN = Math.PI / 180;

function renderLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
}) {
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#64748b"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-sm font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function LeaveDistributionChart({ data }: Readonly<{ data: PieChartEntry[] }>) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
        No leave types configured
      </div>
    );
  }

  const totalDays = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="flex items-start gap-6">
      <div className="flex-shrink-0">
        <ResponsiveContainer width={320} height={320}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={renderLabel}
              labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
              <RechartsLabel
                value={`${totalDays.toFixed(0)} days`}
                position="center"
                className="text-2xl font-bold"
                fill="#000"
              />
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-3">
        <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Legend
        </div>
        {data.map((entry) => (
          <div
            key={entry.name}
            className="bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-full shadow-sm ring-2 ring-white"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium">{entry.name}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.value.toFixed(1)} days
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
