import { ChangeTypeBadge, badgeConfig } from './ChangeTypeBadge';
import { User, Bot, Zap, ArrowRight } from 'lucide-react';

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function SourceTag({ source, userName }) {
  if (source === 'sync' || source === 'manual') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <User size={11} className="text-amber-500" />
        Manual
      </span>
    );
  }
  if (source === 'webhook' || source === 'shopify') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
        <Bot size={11} className="text-blue-500" />
        Auto
      </span>
    );
  }
  if (source === 'user' && userName) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <User size={11} className="text-gray-400" />
        {userName}
      </span>
    );
  }
  if (source === 'system') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Bot size={11} className="text-gray-400" />
        System
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
      <Zap size={11} className="text-gray-400" />
      API
    </span>
  );
}

export function TimelineItem({ item, onClick, isLast = false }) {
  const config = badgeConfig[item.changeType];

  return (
    <div className="relative flex gap-0">
      <div className="flex flex-col items-center w-12 flex-shrink-0 pt-4">
        <div
          className={`w-3 h-3 rounded-full border-2 flex-shrink-0 z-10 ${
            item.changeType === 'price'
              ? 'border-emerald-500 bg-emerald-100'
              : item.changeType === 'inventory'
              ? 'border-blue-500 bg-blue-100'
              : 'border-purple-500 bg-purple-100'
          }`}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1 bg-gray-100 min-h-[2rem]" />
        )}
      </div>

      <div onClick={onClick} className="flex-1 py-3 pr-4 pb-4 cursor-pointer group">
        <div className="bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-300 hover:shadow-sm transition-all duration-150 group-hover:bg-gray-50/50">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" onError={(e)=>{e.target.src='https://via.placeholder.com/44x44?text=?'}} />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center ${item.changeType === 'price' ? 'bg-emerald-500' : item.changeType === 'inventory' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                <config.icon size={9} className="text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate leading-tight">{item.productName}</p>
                  {item.sku && (<p className="text-xs text-gray-400 mt-0.5">{item.sku}</p>)}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(item.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <ChangeTypeBadge type={item.changeType} />
                <SourceTag source={item.source} userName={item.userName} />
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-gray-400 line-through px-2 py-0.5 bg-gray-50 rounded border border-gray-100">{item.oldValue}</span>
                <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
                <span className={`text-xs px-2 py-0.5 rounded border ${item.changeType === 'price' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : item.changeType === 'inventory' ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-purple-700 bg-purple-50 border-purple-100'}`}>{item.newValue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
