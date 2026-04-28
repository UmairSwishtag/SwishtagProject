import { DollarSign, Package, FileText } from 'lucide-react';

export const badgeConfig = {
  price: {
    label: 'Price Updated',
    icon: DollarSign,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
    dotColor: 'bg-emerald-500',
  },
  inventory: {
    label: 'Inventory Changed',
    icon: Package,
    className: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100',
    dotColor: 'bg-blue-500',
  },
  content: {
    label: 'Content Edited',
    icon: FileText,
    className: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-100',
    dotColor: 'bg-purple-500',
  },
};

export function ChangeTypeBadge({ type, size = 'sm' }) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  if (size === 'md') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${config.className}`}
      >
        <Icon size={13} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${config.className}`}
    >
      <Icon size={10} />
      {config.label}
    </span>
  );
}
