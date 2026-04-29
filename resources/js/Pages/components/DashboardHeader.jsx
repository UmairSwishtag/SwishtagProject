import { Search, Download, SlidersHorizontal, RefreshCw, ChevronDown, Zap } from 'lucide-react';
import { useState } from 'react';

export function DashboardHeader({ searchValue, onSearchChange, onRefresh, totalResults }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange] = useState('Last 7 days');

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 pt-4 pb-0">
        <p className="text-xs text-gray-400">
          Dashboard / <span className="text-gray-600">Change History</span>
        </p>
      </div>

      <div className="flex items-start justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-gray-900">Product Change Dashboard</h1>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Zap size={10} className="text-emerald-500" />
              Shopify Webhooks
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Track all product updates in real time
            {totalResults !== undefined && (
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                {totalResults} records
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:block">Refresh</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={14} />
            <span className="hidden sm:block">Export CSV</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors">
            View Report
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search products, SKUs…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all placeholder:text-gray-400"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
          <span>{dateRange}</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        <select
          className="px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          defaultValue=""
        >
          <option value="">All Change Types</option>
          <option value="price">Price Updates</option>
          <option value="inventory">Inventory Changes</option>
          <option value="content">Content Edits</option>
        </select>

        <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white">
          <SlidersHorizontal size={14} />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
}
