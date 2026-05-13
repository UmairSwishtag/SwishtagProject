import { Bell, DollarSign, Package, FileText, TrendingDown, TrendingUp, ExternalLink } from 'lucide-react';

function typeConfig(type) {
  return (
    {
      price: {
        icon: DollarSign,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        dotColor: 'bg-emerald-500',
      },
      inventory: {
        icon: Package,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        dotColor: 'bg-blue-500',
      },
      content: {
        icon: FileText,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        dotColor: 'bg-purple-500',
      },
    }[type] ?? {
      icon: FileText,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      dotColor: 'bg-gray-400',
    }
  );
}

function buildMessage(change) {
  if (change.changedField === 'created') return 'Product added to catalog';
  if (change.changeType === 'price') {
    if (change.oldValue && change.newValue) {
      const wasNum = parseFloat(String(change.oldValue).replace(/[^0-9.]/g, ''));
      const isNum = parseFloat(String(change.newValue).replace(/[^0-9.]/g, ''));
      return wasNum > isNum
        ? `Price dropped from ${change.oldValue} to ${change.newValue}`
        : `Price raised from ${change.oldValue} to ${change.newValue}`;
    }
    return change.newValue ? `Price updated to ${change.newValue}` : 'Price updated';
  }
  if (change.changeType === 'inventory') {
    if (change.oldValue && change.newValue) {
      const wasNum = parseInt(String(change.oldValue));
      const isNum = parseInt(String(change.newValue));
      return wasNum > isNum
        ? `Inventory decreased by ${wasNum - isNum} units`
        : `Inventory increased by ${isNum - wasNum} units`;
    }
    return change.newValue ? `Inventory updated to ${change.newValue}` : 'Inventory updated';
  }
  if (change.changedField === 'title') return 'Product title updated';
  if (change.changedField === 'body_html') return 'Product description updated';
  if (change.changedField === 'tags') return 'Product tags updated';
  if (change.changedField === 'vendor') return 'Vendor updated';
  return 'Product content updated';
}

function buildDelta(change) {
  if (change.changeType === 'price' && change.oldValue && change.newValue) {
    const wasNum = parseFloat(String(change.oldValue).replace(/[^0-9.]/g, ''));
    const isNum = parseFloat(String(change.newValue).replace(/[^0-9.]/g, ''));
    const diff = Math.abs(wasNum - isNum).toFixed(2);
    return { direction: wasNum > isNum ? 'down' : 'up', value: `$${diff}` };
  }
  if (change.changeType === 'inventory' && change.oldValue && change.newValue) {
    const wasNum = parseInt(String(change.oldValue));
    const isNum = parseInt(String(change.newValue));
    const diff = Math.abs(wasNum - isNum);
    return { direction: wasNum > isNum ? 'down' : 'up', value: `${diff} units` };
  }
  return null;
}

function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function StorefrontWidget({ recentChanges = [] }) {
  // Show the most recent 3 notable changes (price/inventory/content, not just 'created')
  const alerts = recentChanges
    .filter((c) => c.changedField !== 'created' || recentChanges.filter(x => x.changedField !== 'created').length === 0)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <Bell size={13} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm text-gray-900">Storefront Insights</h3>
            <p className="text-xs text-gray-400">Live product alerts</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {alerts.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-400">No recent product changes.</p>
            <p className="text-xs text-gray-300 mt-1">Sync your products to see live alerts.</p>
          </div>
        ) : (
          alerts.map((change, i) => {
            const cfg = typeConfig(change.changeType);
            const Icon = cfg.icon;
            const message = buildMessage(change);
            const delta = buildDelta(change);
            const timeLabel = relativeTime(change.createdAt);

            return (
              <div
                key={change.id ?? i}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors cursor-pointer group"
              >
                <div className={`${cfg.iconBg} ${cfg.iconColor} p-2 rounded-lg flex-shrink-0 mt-0.5`}>
                  <Icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{change.productName}</p>
                  <p className="text-xs text-gray-800 mt-0.5">{message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{timeLabel}</span>
                    {delta && (
                      <span className={`flex items-center gap-0.5 text-xs ${delta.direction === 'down' ? 'text-red-500' : 'text-emerald-600'}`}>
                        {delta.direction === 'down' ? (
                          <TrendingDown size={10} />
                        ) : (
                          <TrendingUp size={10} />
                        )}
                        {delta.value}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
        <button className="text-xs text-blue-600 hover:text-blue-700 transition-colors">View all alerts →</button>
      </div>
    </div>
  );
}
