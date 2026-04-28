// Entry point adapted from the Figma export (renamed to .jsx)
import { useState, useMemo } from 'react';
import { Activity, DollarSign, Package, FileText, Clock } from 'lucide-react';

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

import { mockChanges, productDetails, sparklineData } from './data/mockData';

const START_TODAY = new Date('2026-04-27T00:00:00');
const START_YESTERDAY = new Date('2026-04-26T00:00:00');

function getDateLabel(isoString) {
  const d = new Date(isoString);
  if (d >= START_TODAY) return 'Today';
  if (d >= START_YESTERDAY) return 'Yesterday';
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

export default function App() {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProductName, setSelectedProductName] = useState(null);
  const [isLoading] = useState(false);

  const sortedChanges = useMemo(
    () => [...mockChanges].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    []
  );

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

  const dateGroups = useMemo(() => groupByDate(filteredChanges), [filteredChanges]);

  const selectedProduct = selectedProductName ? productDetails[selectedProductName] ?? null : null;

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

          <WebhookStatusBar />

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
                  count={124}
                  icon={Activity}
                  trend={{ direction: 'up', value: '+12%' }}
                  iconColor="text-slate-600"
                  iconBgColor="bg-slate-100"
                  accentColor="#64748b"
                  sparklineData={sparklineData.total}
                />
                <SummaryCard
                  title="Price Updates"
                  count={48}
                  icon={DollarSign}
                  trend={{ direction: 'up', value: '+8%' }}
                  iconColor="text-emerald-600"
                  iconBgColor="bg-emerald-50"
                  accentColor="#10b981"
                  sparklineData={sparklineData.price}
                />
                <SummaryCard
                  title="Inventory Changes"
                  count={52}
                  icon={Package}
                  trend={{ direction: 'down', value: '-3%' }}
                  iconColor="text-blue-600"
                  iconBgColor="bg-blue-50"
                  accentColor="#3b82f6"
                  sparklineData={sparklineData.inventory}
                />
                <SummaryCard
                  title="Content Edits"
                  count={24}
                  icon={FileText}
                  trend={{ direction: 'up', value: '+5%' }}
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
              <SyncManagementPanel />
              <StorefrontWidget />
              <ActivityChart />

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
                    { label: 'Manual (User)', count: sortedChanges.filter((c) => c.source === 'user').length, icon: '👤', tag: 'Manual', tagColor: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { label: 'Auto (System)', count: sortedChanges.filter((c) => c.source === 'system').length, icon: '🤖', tag: 'Auto', tagColor: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { label: 'API', count: sortedChanges.filter((c) => c.source === 'api').length, icon: '⚡', tag: 'API', tagColor: 'bg-purple-50 text-purple-700 border-purple-200' },
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
