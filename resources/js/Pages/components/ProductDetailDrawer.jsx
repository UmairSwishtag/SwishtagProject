import { useEffect, useState } from 'react';
import { X, Tag, Package, ExternalLink, ArrowRight, User, Bot, Zap, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { ChangeTypeBadge, badgeConfig } from './ChangeTypeBadge';

/**
 * Renders Shopify product HTML (bold, italic, paragraphs, etc.).
 * Content originates from the merchant's own Shopify store — not user-supplied input.
 * A character-capped collapsed view is shown by default.
 */
function HtmlContent({ html, maxChars = 280 }) {
  const [expanded, setExpanded] = useState(false);
  if (!html) return <span className="text-gray-400 text-xs italic">—</span>;

  // Strip tags to estimate plain-text length for the "show more" threshold
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const isLong = plain.length > maxChars;

  return (
    <div className="text-sm leading-relaxed">
      <div
        className={`prose prose-sm max-w-none text-gray-700 overflow-hidden transition-all duration-200 ${
          !expanded && isLong ? 'max-h-[4.5rem]' : 'max-h-[9999px]'
        }`}
        // Content is Shopify-sourced product HTML, not arbitrary user input
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
        >
          {expanded ? <><ChevronUp size={12} />Show less</> : <><ChevronDown size={12} />Show more</>}
        </button>
      )}
    </div>
  );
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (itemDay >= today) return 'Today';
  if (itemDay >= yesterday) return 'Yesterday';
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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';}
      }, [isOpen]);
  
      const [activeTab, setActiveTab] = useState('all');
  
      useEffect(() => {
        setActiveTab('all');
      }, [product?.id, isOpen]);

  if (!product) return null;

  const productUrl = product.adminProductUrl || product.storefrontProductUrl || '';
  const openProductLink = () => {
    if (!productUrl) return;
    window.open(productUrl, '_blank', 'noopener,noreferrer');
  };

      const filteredChanges = product.changes.filter((change) => {
        if (activeTab === 'all') return true;
        return change.changeType === activeTab;
      });
  
      const tabCounts = {
        all: product.changes.length,
        price: product.changes.filter((change) => change.changeType === 'price').length,
        inventory: product.changes.filter((change) => change.changeType === 'inventory').length,
        content: product.changes.filter((change) => change.changeType === 'content').length,
      };
  
      const tabs = [
        { key: 'all', label: 'All Changes' },
        { key: 'price', label: 'Price' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'content', label: 'Content' },
      ];
  
      const grouped = groupByDate(filteredChanges);
  const dateGroups = Object.entries(grouped);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
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

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b border-gray-100">
            <div className="flex gap-5">
              <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={(e)=>{e.target.src='https://via.placeholder.com/112x112?text=?'}} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-gray-900 leading-tight">{product.name}</h3>
                  <button
                    onClick={openProductLink}
                    disabled={!productUrl}
                    title={productUrl ? 'Open product' : 'Product link unavailable'}
                    className="text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-3">{product.sku}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={product.status} />
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">{product.category}</span>
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
                    <p className={`text-lg leading-none ${product.currentInventory < 10 ? 'text-red-600' : 'text-gray-900'}`}>{product.currentInventory}<span className="text-xs text-gray-400 ml-1">units</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900 flex items-center gap-2">Change History
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">{filteredChanges.length} events</span>
              </h3>
            </div>

                <div className="flex items-center gap-2 border-b border-gray-100 mb-4 overflow-x-auto">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-2 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
                          isActive
                            ? 'text-gray-900 border-gray-900'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {tabCounts[tab.key]}
                        </span>
                      </button>
                    );
                  })}
                </div>
            {dateGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No changes found for this tab.</div>
            ) : (
              <div className="space-y-6">
                {dateGroups.map(([dateLabel, changes], groupIdx) => (
                  <div key={dateLabel}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">{dateLabel}</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <div className="space-y-3">
                      {changes.map((change, idx) => {
                        const cfg = badgeConfig[change.changeType];
                        const isFirst = groupIdx === 0 && idx === 0;

                        return (
                          <div key={change.id} className={`relative rounded-xl border p-4 transition-all ${isFirst ? 'border-emerald-200 bg-emerald-50/40 ring-1 ring-emerald-100' : 'border-gray-100 bg-gray-50/50'}`}>
                            {isFirst && (
                              <div className="absolute -top-2 left-3">
                                <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded-full">Latest</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between mb-2">
                              <ChangeTypeBadge type={change.changeType} size="md" />
                              <span className="text-xs text-gray-400">{formatTime(change.createdAt)}</span>
                            </div>

                            <div className="flex items-start gap-2 mt-3">
                              <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-0">
                                <p className="text-xs text-gray-400 mb-1">Before</p>
                                <div className="line-through text-gray-400 opacity-70">
                                  <HtmlContent html={change.oldValue} maxChars={160} />
                                </div>
                              </div>
                              <ArrowRight size={14} className="text-gray-300 flex-shrink-0 mt-6" />
                              <div className={`flex-1 border rounded-lg px-3 py-2 min-w-0 ${change.changeType === 'price' ? 'bg-emerald-50 border-emerald-200' : change.changeType === 'inventory' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
                                <p className="text-xs text-gray-400 mb-1">After</p>
                                <div className={change.changeType === 'price' ? 'text-emerald-800' : change.changeType === 'inventory' ? 'text-blue-800' : 'text-purple-800'}>
                                  <HtmlContent html={change.newValue} maxChars={280} />
                                </div>
                              </div>
                            </div>

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

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Export history</button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
        </div>
      </div>
    </>
  );
}
