import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

export function SummaryCard({
  title,
  count,
  icon: Icon,
  trend,
  iconColor,
  iconBgColor,
  accentColor,
  sparklineData,
}) {
  const isPositiveTrend = trend?.direction === 'up';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200 hover:border-gray-300 group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-[2rem] text-gray-900 leading-none">{count.toLocaleString()}</p>
        </div>
        <div className={`${iconBgColor} ${iconColor} p-2.5 rounded-lg group-hover:scale-105 transition-transform`}>
          <Icon size={20} />
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1 mb-3">
          {isPositiveTrend ? (
            <TrendingUp size={14} className="text-emerald-600" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span className={`text-xs ${isPositiveTrend ? 'text-emerald-600' : 'text-red-500'}`}>{trend.value}</span>
          <span className="text-xs text-gray-400">vs last week</span>
        </div>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <div className="h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accentColor}
                strokeWidth={1.5}
                fill={`url(#gradient-${title})`}
                dot={false}
              />
              <Tooltip
                contentStyle={{ display: 'none' }}
                cursor={{ stroke: accentColor, strokeWidth: 1, strokeDasharray: '2 2' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
