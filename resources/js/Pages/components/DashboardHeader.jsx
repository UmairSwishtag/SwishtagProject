import {
    Search,
    Download,
    SlidersHorizontal,
    RefreshCw,
    ChevronDown,
    Zap,
} from "lucide-react";
import { useState } from "react";

const DATE_RANGES = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "all", label: "All time" },
];

export function DashboardHeader({
    searchValue,
    onSearchChange,
    onRefresh,
    onExportCSV,
    onViewReport,
    totalResults,
    dateRange = "7d",
    onDateRangeChange,
    changeTypeFilter = "",
    onChangeTypeFilter,
    onClearFilters,
    hasActiveFilters = false,
    autoSyncEnabled = false,
    onAutoSyncToggle,
}) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        onRefresh?.();
        setTimeout(() => setIsRefreshing(false), 1000);
    };
    const today = new Date().toISOString().split("T")[0];
    return (
        <div className="bg-white border-b border-gray-200">
            <div className="px-6 pt-4 pb-0">
                <p className="text-xs text-gray-400">
                    Dashboard /{" "}
                    <span className="text-gray-600">Change History</span>
                </p>
            </div>

            <div className="flex items-start justify-between px-6 py-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <h1 className="text-gray-900">
                            Product Change Dashboard
                        </h1>
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
                        type="button"
                        role="switch"
                        aria-checked={autoSyncEnabled}
                        onClick={() => onAutoSyncToggle?.(!autoSyncEnabled)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-sm">Auto Sync</span>
                        <span
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                autoSyncEnabled
                                    ? "bg-emerald-600"
                                    : "bg-gray-300"
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    autoSyncEnabled
                                        ? "translate-x-4"
                                        : "translate-x-0.5"
                                }`}
                            />
                        </span>
                    </button>

                    <button
                        onClick={handleRefresh}
                        className="hidden flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw
                            size={14}
                            className={isRefreshing ? "animate-spin" : ""}
                        />
                        <span className="hidden sm:block">Refresh</span>
                    </button>

                    <button
                        onClick={onExportCSV}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download size={14} />
                        <span className="hidden sm:block">Export CSV</span>
                    </button>

                    <button
                        onClick={onViewReport}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
                    >
                        View Report
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={15}
                    />
                    <input
                        type="text"
                        placeholder="Search products, SKUs…"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all placeholder:text-gray-400"
                    />
                    {searchValue && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <input
                        type="date"
                        max={today}
                        value={dateRange?.from || ""}
                        onChange={(e) =>
                            onDateRangeChange?.({
                                ...dateRange,
                                from: e.target.value,
                            })
                        }
                        className="text-sm bg-transparent outline-none text-gray-600"
                    />

                    <span className="text-gray-400 text-sm">to</span>

                    <input
                        type="date"
                        max={today}
                        value={dateRange?.to || ""}
                        onChange={(e) =>
                            onDateRangeChange?.({
                                ...dateRange,
                                to: e.target.value,
                            })
                        }
                        className="text-sm bg-transparent outline-none text-gray-600"
                    />
                </div>

                <select
                    value={changeTypeFilter}
                    onChange={(e) => onChangeTypeFilter?.(e.target.value)}
                    className="px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                    <option value="">All Change Types</option>
                    <option value="price">Price Updates</option>
                    <option value="inventory">Inventory Changes</option>
                    <option value="content">Content Edits</option>
                </select>

                <button
                    type="button"
                    onClick={onClearFilters}
                    disabled={!hasActiveFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SlidersHorizontal size={14} />
                    <span>Clear Filters</span>
                </button>
            </div>
        </div>
    );
}
