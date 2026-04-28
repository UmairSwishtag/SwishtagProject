import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { activityChartData } from '../data/mockData';
import { BarChart2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 text-xs">
        <p className="text-gray-500 mb-1.5">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-gray-600 capitalize">{entry.name}:</span>
            <span className="text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ActivityChart() {
  const total = activityChartData.reduce(
    (acc, d) => acc + d.price + d.inventory + d.content,
    0
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <BarChart2 size={14} className="text-gray-600" />
            </div>
            <h3 className="text-sm text-gray-900">Activity This Week</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 ml-8">{total} total changes</p>
        </div>
      </div>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={activityChartData}
            margin={{ top: 0, right: 0, left: -24, bottom: 0 }}
            barSize={8}
            barGap={2}
          >
            <CartesianGrid vertical={false} strokeDasharray="2 4" stroke="#f0f0f0" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.split(' ')[1]}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb', radius: 4 }} />
            <Bar dataKey="price" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="inventory" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="content" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {[
          { color: 'bg-emerald-500', label: 'Price' },
          { color: 'bg-blue-500', label: 'Inventory' },
          { color: 'bg-purple-500', label: 'Content' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
