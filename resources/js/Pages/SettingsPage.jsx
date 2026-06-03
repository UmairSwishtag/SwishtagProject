// Entry point adapted from the design export (renamed to .jsx)
import { useState, useMemo, useEffect } from 'react';
import { Activity, DollarSign, Package, FileText, Clock, AlertTriangle, X, Printer, ChevronDown } from 'lucide-react';

import { TopNav } from './components/TopNav';
import { DashboardHeader } from './components/DashboardHeader';
import { SummaryCard } from './components/SummaryCard';
import { TimelineItem } from './components/TimelineItem';
import { ProductDetailDrawer } from './components/ProductDetailDrawer';
import { EmptyState } from './components/EmptyState';
import { SkeletonCard, SkeletonTimelineItem, SkeletonDateGroup } from './components/SkeletonLoader';
import { FilterTabs } from './components/FilterTabs';
import { StorefrontWidget } from './components/StorefrontWidget';
import { ActivityChart } from './components/ActivityChart';
import { SyncManagementPanel } from './components/SyncManagementPanel';
import { WebhookStatusBar } from './components/WebhookStatusBar';

import { mockChanges, productDetails } from './data/MockData';

function getDateLabel(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (itemDay >= today) return 'Today';
  if (itemDay >= yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupByDate(items) {
  const map = new Map();
  for (const item of items) {
    const label = getDateLabel(item.createdAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(item);
  }
  return Array.from(map.entries());
}

function stripHtmlTags(value) {
  return String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function Products() {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [changeTypeFilter, setChangeTypeFilter] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('autoSyncEnabled') === 'true';
  });
  const [selectedProductName, setSelectedProductName] = useState(null);
  const [changes, setChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [showReport, setShowReport] = useState(false);
  const shopParam = new URLSearchParams(window.location.search).get('shop');

  useEffect(() => {
    localStorage.setItem('autoSyncEnabled', String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  const dataSource = fetchError ? mockChanges : changes;
  const sortedChanges = useMemo(
    () => [...dataSource].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [dataSource]
  );

  const fetchChanges = () => {
    const endpoint = shopParam
      ? `/api/product-changes?shop=${encodeURIComponent(shopParam)}`
      : '/api/product-changes';
    fetch(endpoint, { credentials: 'include' })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((data) => { setChanges(Array.isArray(data) ? data : []); setFetchError(null); setIsLoading(false); })
      .catch((err) => { setFetchError(err.message); setIsLoading(false); });
  };

  useEffect(() => {
    fetchChanges();
    const interval = setInterval(fetchChanges, 30_000);
    return () => clearInterval(interval);
  }, [shopParam]);

  const filteredChanges = useMemo(() => {
    return sortedChanges.filter((change) => {
      const q = searchValue.toLowerCase();
      const matchesSearch =
        stripHtmlTags(change.productName).toLowerCase().includes(q) ||
        stripHtmlTags(change.sku).toLowerCase().includes(q);

      const changeDate = change.createdAt ? new Date(change.createdAt) : null;
      let matchesDateRange = true;
      if (changeDate instanceof Date && !Number.isNaN(changeDate.getTime()) && dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const cutoff = new Date();
        cutoff.setHours(0, 0, 0, 0);
        cutoff.setDate(cutoff.getDate() - (days - 1));
        matchesDateRange = changeDate >= cutoff;
      }

      const matchesTab = activeTab === 'all' || change.changeType === activeTab;
      const matchesChangeType = changeTypeFilter === '' || change.changeType === changeTypeFilter;
      return matchesSearch && matchesTab && matchesDateRange && matchesChangeType;
    });
  }, [sortedChanges, searchValue, activeTab, dateRange, changeTypeFilter]);

  const counts = useMemo(
    () => ({
      all: sortedChanges.length,
      price: sortedChanges.filter((c) => c.changeType === 'price').length,
      inventory: sortedChanges.filter((c) => c.changeType === 'inventory').length,
      content: sortedChanges.filter((c) => c.changeType === 'content').length,
    }),
    [sortedChanges]
  );

  const activityChartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayChanges = sortedChanges.filter((c) => c.createdAt?.startsWith(dayStr));
      return {
        day: dayLabel,
        price: dayChanges.filter((c) => c.changeType === 'price').length,
        inventory: dayChanges.filter((c) => c.changeType === 'inventory').length,
        content: dayChanges.filter((c) => c.changeType === 'content').length,
      };
    });
  }, [sortedChanges]);

  const sparklineData = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const makeSeries = (subset) => days.map((day) => ({ v: subset.filter((c) => c.createdAt?.startsWith(day)).length }));
    return {
      total: makeSeries(sortedChanges),
      price: makeSeries(sortedChanges.filter((c) => c.changeType === 'price')),
      inventory: makeSeries(sortedChanges.filter((c) => c.changeType === 'inventory')),
      content: makeSeries(sortedChanges.filter((c) => c.changeType === 'content')),
    };
  }, [sortedChanges]);

  const dateGroups = useMemo(() => groupByDate(filteredChanges), [filteredChanges]);

  // Pagination
  useEffect(() => { setVisibleCount(20); }, [searchValue, activeTab, dateRange, changeTypeFilter]);
  const visibleChanges = filteredChanges.slice(0, visibleCount);
  const hasMore = filteredChanges.length > visibleCount;
  const visibleDateGroups = useMemo(() => groupByDate(visibleChanges), [visibleChanges]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductName) return null;

    const changesForProduct = sortedChanges.filter((c) => c.productName === selectedProductName);
    const firstFromChanges = changesForProduct[0] ?? null;

    // If we have a full product entry, return it
    const full = productDetails[selectedProductName];
    if (full) {
      return {
        ...full,
        adminProductUrl: full.adminProductUrl || firstFromChanges?.adminProductUrl || null,
        storefrontProductUrl: full.storefrontProductUrl || firstFromChanges?.storefrontProductUrl || null,
        shopifyProductId: full.shopifyProductId || firstFromChanges?.shopifyProductId || null,
        productHandle: full.productHandle || firstFromChanges?.productHandle || null,
      };
    }

    // Fallback: build a minimal product object from the changes list so
    // the drawer can open for items that don't have a full productDetails entry.
    if (changesForProduct.length === 0) return null;

    const first = changesForProduct[0];
    const priceChange = changesForProduct.find((c) => c.changeType === 'price');
    const inventoryChange = changesForProduct.find((c) => c.changeType === 'inventory');

    const parseInventory = (val) => {
      if (!val) return 0;
      const m = String(val).match(/(\d+)/);
      return m ? Number(m[1]) : 0;
    };

    return {
      id: `fallback-${first.sku ?? first.productName}`,
      name: selectedProductName,
      image: first.productImage,
      currentPrice: priceChange ? priceChange.newValue : (first.newValue ?? ''),
      currentInventory: inventoryChange ? parseInventory(inventoryChange.newValue) : parseInventory(first.newValue),
      sku: first.sku,
      status: 'active',
      category: 'Uncategorized',
      adminProductUrl: first.adminProductUrl || null,
      storefrontProductUrl: first.storefrontProductUrl || null,
      shopifyProductId: first.shopifyProductId || null,
      productHandle: first.productHandle || null,
      changes: changesForProduct,
    };
  }, [selectedProductName, productDetails, sortedChanges]);

  const handleItemClick = (productName) => setSelectedProductName(productName);

  const handleReset = () => {
    setSearchValue('');
    setActiveTab('all');
    setDateRange('7d');
    setChangeTypeFilter('');
  };

  const hasActiveHeaderFilters = searchValue.trim() !== '' || dateRange !== '7d' || changeTypeFilter !== '';

  const handleExportCSV = () => {
    if (filteredChanges.length === 0) return;
    const headers = ['Product Name', 'SKU', 'Change Type', 'Field', 'Old Value', 'New Value', 'Source', 'Date'];
    const escape = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = filteredChanges.map((c) => [
      escape(stripHtmlTags(c.productName)), escape(stripHtmlTags(c.sku)), escape(c.changeType), escape(c.changedField),
      escape(stripHtmlTags(c.oldValue)), escape(stripHtmlTags(c.newValue)), escape(c.source),
      escape(c.createdAt ? new Date(c.createdAt).toLocaleString() : ''),
    ].join(','));
    const csv = [headers.map(escape).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-changes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      <TopNav />

      <div className="pt-14">
        <DashboardHeader
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          autoSyncEnabled={autoSyncEnabled}
          onAutoSyncToggle={setAutoSyncEnabled}
          totalResults={sortedChanges.length}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          changeTypeFilter={changeTypeFilter}
          onChangeTypeFilter={setChangeTypeFilter}
          onClearFilters={handleReset}
          hasActiveFilters={hasActiveHeaderFilters}
          onRefresh={fetchChanges}
          onExportCSV={handleExportCSV}
          onViewReport={() => setShowReport(true)}
        />

        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

          <WebhookStatusBar recentChanges={sortedChanges.slice(0, 5)} />

          {fetchError && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">Could not reach the API ({fetchError}). Showing cached data.</p>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <SummaryCard
                  title="Total Changes"
                  count={counts.all}
                  icon={Activity}
                  trend={null}
                  iconColor="text-slate-600"
                  iconBgColor="bg-slate-100"
                  accentColor="#64748b"
                  sparklineData={sparklineData.total}
                />
                <SummaryCard
                  title="Price Updates"
                  count={counts.price}
                  icon={DollarSign}
                  trend={null}
                  iconColor="text-emerald-600"
                  iconBgColor="bg-emerald-50"
                  accentColor="#10b981"
                  sparklineData={sparklineData.price}
                />
                <SummaryCard
                  title="Inventory Changes"
                  count={counts.inventory}
                  icon={Package}
                  trend={null}
                  iconColor="text-blue-600"
                  iconBgColor="bg-blue-50"
                  accentColor="#3b82f6"
                  sparklineData={sparklineData.inventory}
                />
                <SummaryCard
                  title="Content Edits"
                  count={counts.content}
                  icon={FileText}
                  trend={null}
                  iconColor="text-purple-600"
                  iconBgColor="bg-purple-50"
                  accentColor="#8b5cf6"
                  sparklineData={sparklineData.content}
                />
              </>
            )}
          </div>

          <div className="flex gap-6 items-start">

            <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    <Clock size={14} className="text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-sm text-gray-900">Change Timeline</h2>
                    <p className="text-xs text-gray-400">Click any item for full details</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
                  {Math.min(visibleCount, filteredChanges.length)} of {filteredChanges.length} shown
                </span>
              </div>

              <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

              <div className="min-h-[200px]">
                {isLoading ? (
                  <>
                    <SkeletonDateGroup />
                    <SkeletonTimelineItem />
                    <SkeletonTimelineItem />
                    <SkeletonDateGroup />
                    <SkeletonTimelineItem />
                    <SkeletonTimelineItem />
                  </>
                ) : filteredChanges.length === 0 ? (
                  <EmptyState
                    type={searchValue || activeTab !== 'all' ? 'no-results' : 'no-changes'}
                    onReset={handleReset}
                  />
                ) : (
                  <div className="px-3 pb-4">
                    {visibleDateGroups.map(([dateLabel, items]) => (
                      <div key={dateLabel} className="pt-4">
                        <div className="flex items-center gap-3 px-1 mb-1">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap border border-gray-200">
                            {dateLabel}
                            <span className="ml-1.5 text-gray-400">· {items.length}</span>
                          </span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        {items.map((change, idx) => (
                          <TimelineItem
                            key={change.id}
                            item={change}
                            onClick={() => handleItemClick(change.productName)}
                            isLast={idx === items.length - 1}
                          />
                        ))}
                      </div>
                    ))}
                    {hasMore && (
                      <div className="pt-4 flex justify-center">
                        <button
                          onClick={() => setVisibleCount((v) => v + 20)}
                          className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        >
                          <ChevronDown size={15} className="text-gray-400" />
                          Load more
                          <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                            {filteredChanges.length - visibleCount} remaining
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="w-72 flex-shrink-0 space-y-4">
              <div className={autoSyncEnabled ? 'hidden' : ''}>
                <SyncManagementPanel
                  onSyncComplete={fetchChanges}
                  autoSyncEnabled={autoSyncEnabled}
                />
              </div>
              <StorefrontWidget recentChanges={sortedChanges.slice(0, 5)} />
              <ActivityChart data={activityChartData} />

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm text-gray-900 mb-3">Change Breakdown</h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Price Updates', count: counts.price, total: counts.all, color: 'bg-emerald-500' },
                    { label: 'Inventory', count: counts.inventory, total: counts.all, color: 'bg-blue-500' },
                    { label: 'Content Edits', count: counts.content, total: counts.all, color: 'bg-purple-500' },
                  ].map(({ label, count, total, color }) => {
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${color}`} />
                            <span className="text-xs text-gray-600">{label}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {count} <span className="text-gray-300">·</span>{' '}
                            <span className="text-gray-400">{pct}%</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${color} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm text-gray-900 mb-3">Change Sources</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Webhook (Auto)', count: sortedChanges.filter((c) => c.source === 'webhook').length, icon: '⚡', tag: 'Webhook', tagColor: 'bg-purple-50 text-purple-700 border-purple-200' },
                    { label: 'Manual Sync', count: sortedChanges.filter((c) => c.source === 'sync').length, icon: '🔄', tag: 'Sync', tagColor: 'bg-blue-50 text-blue-700 border-blue-200' },
                  ].map(({ label, count, icon, tag, tagColor }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{icon}</span>
                        <span className="text-xs text-gray-600">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs border px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                        <span className="text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full min-w-[24px] text-center">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductDetailDrawer
        isOpen={!!selectedProductName}
        onClose={() => setSelectedProductName(null)}
        product={selectedProduct}
      />

      {showReport && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowReport(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-gray-900">Product Change Report</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filteredChanges.length} record{filteredChanges.length !== 1 ? 's' : ''} · Generated {new Date().toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Printer size={14} />Print
                </button>
                <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Export CSV
                </button>
                <button onClick={() => setShowReport(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
              {[
                { label: 'Total Changes', value: counts.all, color: 'text-gray-900' },
                { label: 'Price Updates', value: counts.price, color: 'text-emerald-700' },
                { label: 'Inventory', value: counts.inventory, color: 'text-blue-700' },
                { label: 'Content Edits', value: counts.content, color: 'text-purple-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white px-5 py-4 text-center">
                  <p className={`text-2xl tabular-nums ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Product</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Change</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Source</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredChanges.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-2.5">
                        <p className="text-xs text-gray-800 truncate max-w-[200px]">{stripHtmlTags(c.productName) || '—'}</p>
                        {stripHtmlTags(c.sku) && <p className="text-xs text-gray-400">{stripHtmlTags(c.sku)}</p>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          c.changeType === 'price' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          c.changeType === 'inventory' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>{c.changeType}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {stripHtmlTags(c.oldValue) && stripHtmlTags(c.newValue) ? (
                          <span className="text-xs text-gray-500">
                            <span className="line-through text-gray-400">{stripHtmlTags(c.oldValue)}</span>
                            <span className="mx-1 text-gray-300">→</span>
                            <span className="text-gray-700">{stripHtmlTags(c.newValue)}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">{stripHtmlTags(c.newValue) || stripHtmlTags(c.oldValue) || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 capitalize">{c.source}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
