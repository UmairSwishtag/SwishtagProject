import { useEffect } from 'react';
import { X, Tag, Package, ExternalLink, ArrowRight, User, Bot, Zap, CheckCircle2 } from 'lucide-react';
import { ChangeTypeBadge, badgeConfig } from './ChangeTypeBadge';

function formatDate(isoString) {
  const date = new Date(isoString);
  const startOfToday = new Date('2026-04-27T00:00:00');
  const startOfYesterday = new Date('2026-04-26T00:00:00');

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function groupByDate(changes) {
  return changes.reduce((acc, change) => {
    const label = formatDate(change.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(change);
    return acc;
  }, {});
}

function SourceTag({ source, userName }) {
  if (source === 'user' && userName) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <User size={11} /> {userName}
      </span>
    );
  }
  if (source === 'system') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <Bot size={11} /> System
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400">
      <Zap size={11} /> API
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    archived: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${styles[status]}`}>
      <CheckCircle2 size={10} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function ProductDetailDrawer({ isOpen, onClose, product }) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!product) return null;

  const grouped = groupByDate(product.changes);
  const dateGroups = Object.entries(grouped);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-gray-900">Product Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Product Hero */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex gap-5">
              <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/112x112?text=?';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-gray-900 leading-tight">{product.name}</h3>
                  <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <ExternalLink size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-3">{product.sku}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={product.status} />
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                    {product.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Tag size={12} className="text-gray-400" />
                      <p className="text-xs text-gray-400">Current Price</p>
                    </div>
                    <p className="text-gray-900 text-lg leading-none">{product.currentPrice}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Package size={12} className="text-gray-400" />
                      <p className="text-xs text-gray-400">In Stock</p>
                    </div>
                    <p
                      className={`text-lg leading-none ${
                        product.currentInventory < 10 ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {product.currentInventory}
                      <span className="text-xs text-gray-400 ml-1">units</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change History */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900 flex items-center gap-2">
                Change History
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                  {product.changes.length} events
                </span>
              </h3>
            </div>

            {dateGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No changes recorded yet.
              </div>
            ) : (
              <div className="space-y-6">
                {dateGroups.map(([dateLabel, changes], groupIdx) => (
                  <div key={dateLabel}>
                    {/* Date Divider */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {dateLabel}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Changes for this date */}
                    <div className="space-y-3">
                      {changes.map((change, idx) => {
                        const cfg = badgeConfig[change.changeType];
                        const isFirst = groupIdx === 0 && idx === 0;

                        return (
                          <div
                            key={change.id}
                            className={`relative rounded-xl border p-4 transition-all ${
                              isFirst
                                ? change.changeType === 'price'
                                  ? 'border-emerald-200 bg-emerald-50/40 ring-1 ring-emerald-100'
                                  : change.changeType === 'inventory'
                                  ? 'border-blue-200 bg-blue-50/40 ring-1 ring-blue-100'
                                  : 'border-purple-200 bg-purple-50/40 ring-1 ring-purple-100'
                                : 'border-gray-100 bg-gray-50/50'
                            }`}
                          >
                            {isFirst && (
                              <div className="absolute -top-2 left-3">
                                <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded-full">
                                  Latest
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between mb-2">
                              <ChangeTypeBadge type={change.changeType} size="md" />
                              <span className="text-xs text-gray-400">
                                {formatTime(change.createdAt)}
                              </span>
                            </div>

                            {/* Value Diff */}
                            <div className="flex items-center gap-2 mt-3">
                              <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400 mb-0.5">Before</p>
                                <p className="text-sm text-gray-500 line-through">{change.oldValue}</p>
                              </div>
                              <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                              <div
                                className={`flex-1 border rounded-lg px-3 py-2 ${
                                  change.changeType === 'price'
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : change.changeType === 'inventory'
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-purple-50 border-purple-200'
                                }`}
                              >
                                <p className="text-xs text-gray-400 mb-0.5">After</p>
                                <p
                                  className={`text-sm ${
                                    change.changeType === 'price'
                                      ? 'text-emerald-800'
                                      : change.changeType === 'inventory'
                                      ? 'text-blue-800'
                                      : 'text-purple-800'
                                  }`}
                                >
                                  {change.newValue}
                                </p>
                              </div>
                            </div>

                            {/* Source */}
                            <div className="mt-2 flex items-center justify-end">
                              <SourceTag source={change.source} userName={change.userName} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Export history
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
