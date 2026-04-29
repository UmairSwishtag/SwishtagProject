import { Search, Activity, RefreshCw } from 'lucide-react';

function NoChangesIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="56" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="36" y="28" width="48" height="60" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="44" y="40" width="32" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="44" y="50" width="24" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="44" y="60" width="28" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="44" y="70" width="20" height="3" rx="1.5" fill="#e2e8f0" />
      <circle cx="78" cy="78" r="18" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2" />
      <circle cx="78" cy="78" r="2" fill="#10b981" />
      <line x1="78" y1="78" x2="78" y2="68" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <line x1="78" y1="78" x2="85" y2="78" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NoResultsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="56" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <circle cx="52" cy="50" r="20" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <circle cx="52" cy="50" r="13" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="45" y="46" width="14" height="2.5" rx="1.25" fill="#e2e8f0" />
      <rect x="45" y="51" width="10" height="2.5" rx="1.25" fill="#e2e8f0" />
      <line x1="67" y1="65" x2="78" y2="76" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
      <circle cx="78" cy="76" r="12" fill="#fef2f2" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="73" y1="71" x2="83" y2="81" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <line x1="83" y1="71" x2="73" y2="81" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({ type, onReset }) {
  const content = {
    'no-changes': {
      illustration: <NoChangesIllustration />,
      icon: Activity,
      title: 'No changes tracked yet',
      description:
        'Changes to your products will appear here automatically. Price updates, inventory adjustments, and content edits are all tracked in real time.',
      action: null,
    },
    'no-results': {
      illustration: <NoResultsIllustration />,
      icon: Search,
      title: 'No matching results',
      description:
        'Your search or filter returned no results. Try a different search term or adjust your filters to see more changes.',
      action: onReset
        ? { label: 'Clear filters', icon: RefreshCw, onClick: onReset }
        : null,
    },
  };

  const { illustration, title, description, action } = content[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="mb-5">{illustration}</div>
      <h3 className="text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 flex items-center gap-2 px-4 py-2 text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
        >
          <action.icon size={14} />
          {action.label}
        </button>
      )}
    </div>
  );
}
