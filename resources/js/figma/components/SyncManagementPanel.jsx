import { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Package, Clock, ChevronDown, RotateCcw } from 'lucide-react';

const INITIAL_LOGS = [
  { id: 1, message: 'Sync completed — 247 products updated', time: '5m ago', type: 'success' },
  { id: 2, message: 'Webhook received: price update', time: '12m ago', type: 'info' },
  { id: 3, message: 'Sync completed — 244 products updated', time: '1h ago', type: 'success' },
];

export function SyncManagementPanel() {
  const [status, setStatus] = useState('success');
  const [progress, setProgress] = useState(0);
  const [lastSyncedText, setLastSyncedText] = useState('5 minutes ago');
  const [totalProducts, setTotalProducts] = useState(247);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [showLogs, setShowLogs] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleSync = () => {
    cleanup();
    setStatus('syncing');
    setProgress(0);
    setAttemptCount((c) => c + 1);

    let current = 0;
    intervalRef.current = setInterval(() => {
      current += Math.random() * 10 + 4;
      if (current >= 92) {
        current = 92;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(Math.min(current, 92));
    }, 120);

    const willFail = (attemptCount + 1) % 4 === 0;

    timeoutRef.current = setTimeout(() => {
      cleanup();
      if (willFail) {
        setProgress(0);
        setStatus('failed');
        setLogs((prev) => [
          {
            id: Date.now(),
            message: 'Sync failed — connection timeout',
            time: 'Just now',
            type: 'error',
          },
          ...prev.slice(0, 4),
        ]);
      } else {
        setProgress(100);
        const added = Math.floor(Math.random() * 5) + 1;
        setStatus('success');
        setLastSyncedText('Just now');
        setTotalProducts((p) => {
          const newTotal = p + added;
          setLogs((prev) => [
            {
              id: Date.now(),
              message: `Sync completed — ${newTotal} products updated`,
              time: 'Just now',
              type: 'success',
            },
            ...prev.slice(0, 4),
          ]);
          return newTotal;
        });
      }
    }, 3600);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  const statusConfig = {
    idle: {
      icon: Clock,
      label: 'Not synced',
      ringColor: 'ring-gray-200',
      iconColor: 'text-gray-400',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
    },
    syncing: {
      icon: RefreshCw,
      label: 'Syncing…',
      ringColor: 'ring-blue-200',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    success: {
      icon: CheckCircle2,
      label: 'Sync complete',
      ringColor: 'ring-emerald-200',
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    failed: {
      icon: AlertTriangle,
      label: 'Sync failed',
      ringColor: 'ring-red-200',
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <RefreshCw size={13} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm text-gray-900">Product Sync</h3>
            <p className="text-xs text-gray-400">Shopify GraphQL</p>
          </div>
        </div>

        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ring-1 ${cfg.bgColor} ${cfg.textColor} ${cfg.ringColor}`}>
          <StatusIcon size={11} className={`${cfg.iconColor} ${status === 'syncing' ? 'animate-spin' : ''}`} />
          {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
        <div className="flex flex-col items-center justify-center py-3 border-r border-gray-100">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Package size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500">Total Synced</span>
          </div>
          <span className="text-lg text-gray-900 tabular-nums">{totalProducts}</span>
          <span className="text-xs text-gray-400">products</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500">Last Sync</span>
          </div>
          <span className="text-xs text-gray-700">{lastSyncedText}</span>
          {status === 'success' && (
            <span className="text-xs text-emerald-600 mt-0.5">✓ Successful</span>
          )}
          {status === 'failed' && (
            <span className="text-xs text-red-500 mt-0.5">✗ Failed</span>
          )}
        </div>
      </div>

      {status === 'syncing' && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-blue-600">Syncing products…</span>
            <span className="text-xs text-blue-500 tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Fetching from Shopify GraphQL API…</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="mx-4 mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-red-700">Connection to Shopify timed out.</p>
              <p className="text-xs text-red-400 mt-0.5">Check your API credentials and try again.</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-3 pb-3">
        <button
          onClick={handleSync}
          disabled={status === 'syncing'}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all duration-200 ${
            status === 'syncing'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : status === 'failed'
              ? 'bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-sm'
              : 'bg-[#1a1a2e] text-white hover:bg-[#2d2d4e] border border-[#1a1a2e] shadow-sm'
          }`}
        >
          {status === 'syncing' ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Syncing…
            </>
          ) : status === 'failed' ? (
            <>
              <RotateCcw size={14} />
              Retry Sync
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Sync Products
            </>
          )}
        </button>
      </div>

      <div className="border-t border-gray-100">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-xs text-gray-500"
        >
          <span>Sync activity log</span>
          <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${showLogs ? 'rotate-180' : ''}`} />
        </button>

        {showLogs && (
          <div className="px-4 pb-3 space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${log.type === 'success' ? 'bg-emerald-500' : log.type === 'error' ? 'bg-red-500' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 leading-snug">{log.message}</p>
                  <p className="text-xs text-gray-400">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
