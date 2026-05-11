import { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Package, Clock, ChevronDown, RotateCcw } from 'lucide-react';

export function SyncManagementPanel() {
  const [status, setStatus] = useState('idle');
  const [lastSyncedText, setLastSyncedText] = useState(() => localStorage.getItem('syncLastText') || 'Never');
  const [totalProducts, setTotalProducts] = useState(() => Number(localStorage.getItem('syncTotalProducts') || 0));
  const [errorMessage, setErrorMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const progressIntervalRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const shopParam = new URLSearchParams(window.location.search).get('shop');

  const cleanup = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleSync = async () => {
    if (status === 'syncing') return;

    cleanup();
    setStatus('syncing');
    setProgress(0);
    setErrorMessage('');

    let current = 0;
    progressIntervalRef.current = setInterval(() => {
      current += Math.random() * 8 + 3;
      if (current >= 80) {
        current = 80;
        cleanup();
      }
      setProgress(Math.min(current, 80));
    }, 200);

    try {
      const endpoint = shopParam
        ? `/sync-products?shop=${encodeURIComponent(shopParam)}`
        : '/sync-products';
      const res = await fetch(endpoint, { credentials: 'include' });
      cleanup();

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const synced = data.products_synced ?? 0;

      setProgress(100);
      setStatus('success');
      setTotalProducts(synced);
      setLastSyncedText('Just now');
      localStorage.setItem('syncTotalProducts', String(synced));
      localStorage.setItem('syncLastText', new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
      }));

      setLogs((prev) => [
        {
          id: Date.now(),
          message: `Sync completed - ${synced} products updated`,
          time: 'Just now',
          type: 'success',
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      cleanup();
      setProgress(0);
      setStatus('failed');
      setErrorMessage(err.message || 'Connection failed');
      setLogs((prev) => [
        {
          id: Date.now(),
          message: `Sync failed - ${err.message || 'connection error'}`,
          time: 'Just now',
          type: 'error',
        },
        ...prev.slice(0, 9),
      ]);
    }
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
      label: 'Syncing...',
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
            <p className="text-xs text-gray-400">Shopify GraphQL API</p>
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
            <span className="text-xs text-emerald-600 mt-0.5">Successful</span>
          )}
          {status === 'failed' && (
            <span className="text-xs text-red-500 mt-0.5">Failed</span>
          )}
        </div>
      </div>

      {status === 'syncing' && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-blue-600">Syncing products and collections...</span>
            <span className="text-xs text-blue-500 tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Fetching from Shopify Admin API...</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="mx-4 mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-red-700">{errorMessage || 'Connection to Shopify failed.'}</p>
              {errorMessage && errorMessage.toLowerCase().includes('reinstall') && (
                <p className="text-xs text-red-500 mt-0.5 font-medium">Action required: Reinstall the app to re-authorize.</p>
              )}
              {(!errorMessage || !errorMessage.toLowerCase().includes('reinstall')) && (
                <p className="text-xs text-red-400 mt-0.5">Check your API credentials and try again.</p>
              )}
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
              Syncing...
            </>
          ) : status === 'failed' ? (
            <>
              <RotateCcw size={14} />
              Retry Sync
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Sync Products and Collections
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
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No sync activity yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${log.type === 'success' ? 'bg-emerald-500' : log.type === 'error' ? 'bg-red-500' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 leading-snug">{log.message}</p>
                    <p className="text-xs text-gray-400">{log.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
