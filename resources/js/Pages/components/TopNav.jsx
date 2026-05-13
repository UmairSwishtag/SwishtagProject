import { useState } from 'react';
import {
  Activity,
  Store,
  HelpCircle,
  Bell,
  ChevronDown,
  Search,
  X,
  Settings,
  BarChart2,
  Package,
  Wifi,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
export function TopNav() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, text: 'Price dropped on 3 products', time: '5m ago', unread: true },
    { id: 2, text: 'Inventory alert: Leather Bag low stock', time: '1h ago', unread: true },
    { id: 3, text: 'Bulk update completed (12 items)', time: '3h ago', unread: false },
  ]);
  const unreadCount = notifications.filter((n) => n.unread).length;
const [helpOpen, setHelpOpen] = useState(false);
  const navItems = [
    // { icon: BarChart2, label: 'Dashboard', href: '/dashboard' },
    // { icon: Package, label: 'Products', href: '/products' },
    // { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#1a1a2e] border-b border-white/10 flex items-center px-4 gap-3">
      <div className="flex items-center gap-2.5 pr-4 border-r border-white/10">
        <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Activity size={14} className="text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-white text-sm leading-tight">ChangeTracker</p>
          <p className="text-white/40 text-[10px] leading-none">by AppStore</p>
        </div>
      </div>

      {/* <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 transition-colors text-sm text-white/80 hover:text-white border border-white/10">
        <Store size={13} className="text-emerald-400" />
        <span className="hidden md:block text-xs">my-store.myshopify.com</span>
        <ChevronDown size={12} className="text-white/40" />
      </button> */}

      <nav className="hidden lg:flex items-center gap-0.5 ml-2">
        {navItems.map(({ icon: Icon, label, active, href }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${active
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/8'
              }`}
          >
            <Icon size={13} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs text-emerald-400">Live</span>
      </div>

      {/* <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 transition-colors text-white/60 hover:text-white/90 text-xs border border-white/10">
        <Search size={13} />
        <span>Quick search</span>
        <kbd className="ml-1 text-white/30 text-[10px]">⌘K</kbd>
      </button> */}

      <div className="relative">
  <button
    onClick={() => setHelpOpen(!helpOpen)}
    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
  >
    <HelpCircle size={16} />
  </button>

  {helpOpen && (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setHelpOpen(false)}
      />

      <div className="absolute right-0 top-10 w-64 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            Help & Resources
          </p>
        </div>

        <div className="p-2">
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <p className="text-sm text-gray-800">Documentation</p>
            <p className="text-xs text-gray-400">
              Learn how to use the app
            </p>
          </button>

          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <p className="text-sm text-gray-800">Contact Support</p>
            <p className="text-xs text-gray-400">
              Get help from our team
            </p>
          </button>

          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <p className="text-sm text-gray-800">Feature Requests</p>
            <p className="text-xs text-gray-400">
              Suggest improvements
            </p>
          </button>
        </div>
      </div>
    </>
  )}
</div>

      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-10 w-72 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm text-gray-900">Notifications</p>
                {unreadCount > 0 && (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {unreadCount} new
                  </span>
                )}
                <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 ml-auto">
                  <X size={14} />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${n.unread ? 'bg-blue-50/40' : ''
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      {n.unread && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className={n.unread ? '' : 'pl-3.5'}>
                        <p className="text-xs text-gray-700">{n.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-100 hidden">
                <button className="text-xs text-blue-600 hover:text-blue-700">
                  View all notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-emerald-400/50 transition-all">
        <span className="text-white text-xs">JD</span>
      </div>
    </header>
  );
}
