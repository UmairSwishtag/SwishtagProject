import { Bell, DollarSign, Package, FileText, TrendingDown, TrendingUp, ExternalLink } from 'lucide-react';

const NOTIFICATIONS = [
  {
    type: 'price',
    productName: 'Premium Wireless Headphones',
    message: 'Price dropped by $50',
    time: '2 hours ago',
    delta: { direction: 'down', value: '$50.00' },
  },
  {
    type: 'inventory',
    productName: 'Organic Cotton T-Shirt',
    message: 'Inventory decreased by 13 units',
    time: '5 hours ago',
    delta: { direction: 'down', value: '13 units' },
  },
  {
    type: 'content',
    productName: 'Stainless Steel Water Bottle',
    message: 'Product title updated',
    time: '1 day ago',
  },
];

function typeConfig(type) {
  return {
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
  }[type];
}

export function StorefrontWidget() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
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

      {/* Notifications */}
      <div className="divide-y divide-gray-50">
        {NOTIFICATIONS.map((notif, i) => {
          const cfg = typeConfig(notif.type);
          const Icon = cfg.icon;

          return (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors cursor-pointer group"
            >
              <div className={`${cfg.iconBg} ${cfg.iconColor} p-2 rounded-lg flex-shrink-0 mt-0.5`}>
                <Icon size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 truncate">{notif.productName}</p>
                <p className="text-xs text-gray-800 mt-0.5">{notif.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{notif.time}</span>
                  {notif.delta && (
                    <span
                      className={`flex items-center gap-0.5 text-xs ${
                        notif.delta.direction === 'down' ? 'text-red-500' : 'text-emerald-600'
                      }`}
                    >
                      {notif.delta.direction === 'down' ? (
                        <TrendingDown size={10} />
                      ) : (
                        <TrendingUp size={10} />
                      )}
                      {notif.delta.value}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink
                size={12}
                className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1"
              />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
        <button className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
          View all alerts →
        </button>
      </div>
    </div>
  );
}

// Inline widget for embedding on product pages
export function StorefrontInlineWidget({ message, timestamp, type = 'price' }) {
  const cfg = typeConfig(type);
  const Icon = cfg.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
        type === 'price'
          ? 'bg-emerald-50 border-emerald-200'
          : type === 'inventory'
          ? 'bg-blue-50 border-blue-200'
          : 'bg-purple-50 border-purple-200'
      }`}
    >
      <Icon
        size={13}
        className={
          type === 'price'
            ? 'text-emerald-600'
            : type === 'inventory'
            ? 'text-blue-600'
            : 'text-purple-600'
        }
      />
      <span
        className={`text-xs ${
          type === 'price'
            ? 'text-emerald-800'
            : type === 'inventory'
            ? 'text-blue-800'
            : 'text-purple-800'
        }`}
      >
        <span className="font-medium">{message}</span>
        <span className="opacity-70"> · {timestamp}</span>
      </span>
    </div>
  );
}
