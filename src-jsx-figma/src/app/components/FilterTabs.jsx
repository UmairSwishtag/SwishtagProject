import { Activity, DollarSign, Package, FileText } from 'lucide-react';

const tabs = [
  {
    id: 'all',
    label: 'All Changes',
    icon: Activity,
    activeClass: 'border-gray-800 text-gray-800',
    countClass: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-500',
  },
  {
    id: 'price',
    label: 'Price',
    icon: DollarSign,
    activeClass: 'border-emerald-600 text-emerald-700',
    countClass: 'bg-emerald-50 text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    activeClass: 'border-blue-600 text-blue-700',
    countClass: 'bg-blue-50 text-blue-700',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'content',
    label: 'Content',
    icon: FileText,
    activeClass: 'border-purple-600 text-purple-700',
    countClass: 'bg-purple-50 text-purple-700',
    dotColor: 'bg-purple-500',
  },
];

export function FilterTabs({ activeTab, onTabChange, counts }) {
  return (
    <div className="flex items-center gap-1 px-4 border-b border-gray-100">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3 py-3.5 text-sm border-b-2 transition-all duration-150 whitespace-nowrap ${
              isActive
                ? tab.activeClass
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
            }`}
          >
            {isActive && <span className={`w-1.5 h-1.5 rounded-full ${tab.dotColor}`} />}
            <Icon size={14} />
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs tabular-nums ${
                isActive ? tab.countClass : 'bg-gray-100 text-gray-500'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
