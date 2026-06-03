import { useState, useMemo } from 'react';
import { Clock, Zap, X, Wifi } from 'lucide-react';

function formatRelative(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WebhookStatusBar({ recentChanges = [] }) {
  const [connectionStatus] = useState('connected');
  const [dismissed, setDismissed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const eventCount = useMemo(
    () => recentChanges.filter((c) => c.createdAt?.startsWith(todayStr)).length,
    [recentChanges, todayStr]
  );

  const lastUpdateText = useMemo(() => {
    if (recentChanges.length === 0) return 'No updates yet';
    return formatRelative(recentChanges[0].createdAt);
  }, [recentChanges]);

  const recentEvents = useMemo(
    () =>
      recentChanges.slice(0, 3).map((c) => ({
        id:    c.id,
        label: `${c.changeType} — ${c.productName}`,
        time:  formatRelative(c.createdAt),
      })),
    [recentChanges]
  );

  if (dismissed) return null;

  const isConnected = connectionStatus === 'connected';

  return (
    <div
      className={`relative flex items-center gap-4 px-4 py-2.5 rounded-xl border text-xs transition-all ${
        isConnected
          ? 'bg-emerald-50/70 border-emerald-200'
          : connectionStatus === 'reconnecting'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 block ${isConnected ? 'bg-emerald-500' : connectionStatus === 'reconnecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
          {isConnected && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />}
        </div>
        <span className={`whitespace-nowrap ${isConnected ? 'text-emerald-700' : connectionStatus === 'reconnecting' ? 'text-amber-700' : 'text-red-700'}`}>{isConnected ? 'Real-time updates active' : connectionStatus === 'reconnecting' ? 'Reconnecting…' : 'Disconnected'}</span>
      </div>

      <div className="w-px h-4 bg-emerald-200 flex-shrink-0" />

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Clock size={11} className="text-emerald-500" />
        <span className="text-emerald-600">Last update: <span className="text-emerald-700">{lastUpdateText}</span></span>
      </div>

      <div className="hidden sm:block w-px h-4 bg-emerald-200 flex-shrink-0" />

      <div className="hidden sm:flex items-center relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-full cursor-default shadow-xs">
          <Zap size={10} className="text-emerald-500" />
          Auto-updated
        </span>

        {showTooltip && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-700">Recent webhook events</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{eventCount} today</span>
            </div>
            <div className="divide-y divide-gray-50">
              {recentEvents.length > 0 ? recentEvents.map((evt) => (
                <div key={evt.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">{evt.label}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{evt.time}</span>
                </div>
              )) : (
                <div className="px-3 py-3 text-xs text-gray-400">No recent events</div>
              )}
            </div>
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">Powered by Shopify webhooks API</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      <span className="hidden md:inline-flex items-center gap-1 text-xs text-emerald-600 bg-white border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">
        <Wifi size={10} />
        {eventCount} events today
      </span>

      <button onClick={() => setDismissed(true)} className="ml-1 p-1 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors flex-shrink-0" title="Dismiss">
        <X size={12} />
      </button>
    </div>
  );
}
