// Entry point adapted from the design export (renamed to .jsx)
import { useState, useMemo, useEffect } from 'react';
import { Activity, DollarSign, Package, FileText, Clock, AlertTriangle } from 'lucide-react';

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

export default function Products() {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProductName, setSelectedProductName] = useState(null);
  const [changes, setChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const shopParam = new URLSearchParams(window.location.search).get('shop');

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
        change.productName.toLowerCase().includes(q) ||
        (change.sku?.toLowerCase().includes(q) ?? false);
      const matchesTab = activeTab === 'all' || change.changeType === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [sortedChanges, searchValue, activeTab]);

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

  const selectedProduct = useMemo(() => {
    if (!selectedProductName) return null;

    // If we have a full product entry, return it
    const full = productDetails[selectedProductName];
    if (full) return full;

    // Fallback: build a minimal product object from the changes list so
    // the drawer can open for items that don't have a full productDetails entry.
    const changesForProduct = sortedChanges.filter((c) => c.productName === selectedProductName);
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
      changes: changesForProduct,
    };
  }, [selectedProductName, productDetails, sortedChanges]);

  const handleItemClick = (productName) => setSelectedProductName(productName);

  const handleReset = () => {
    setSearchValue('');
    setActiveTab('all');
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      <TopNav />

      <div className="pt-14">
        <DashboardHeader
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          totalResults={filteredChanges.length}
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
                  {filteredChanges.length} of {sortedChanges.length} shown
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
                    {dateGroups.map(([dateLabel, items]) => (
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
                  </div>
                )}
              </div>
            </div>

            <div className="w-72 flex-shrink-0 space-y-4">
              <SyncManagementPanel onSyncComplete={fetchChanges} />
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
    </div>
  );
}
