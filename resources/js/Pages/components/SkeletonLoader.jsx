function Shimmer({ className }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 rounded ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Shimmer className="h-3 w-24 mb-2" />
          <Shimmer className="h-8 w-16 mb-3" />
          <Shimmer className="h-3 w-28" />
        </div>
        <Shimmer className="w-10 h-10 rounded-lg" />
      </div>
      <Shimmer className="h-10 w-full mt-3 rounded-lg" />
    </div>
  );
}

export function SkeletonTimelineItem() {
  return (
    <div className="relative flex gap-0 py-1">
      <div className="flex flex-col items-center w-12 flex-shrink-0 pt-4">
        <Shimmer className="w-3 h-3 rounded-full flex-shrink-0" />
        <div className="w-px flex-1 mt-1 bg-gray-100 h-8" />
      </div>

      <div className="flex-1 py-3 pr-4 pb-4">
        <div className="bg-white border border-gray-100 rounded-xl p-3.5">
          <div className="flex items-start gap-3">
            <Shimmer className="w-11 h-11 rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Shimmer className="h-4 w-36" />
                <Shimmer className="h-3 w-16" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Shimmer className="h-5 w-28 rounded-full" />
                <Shimmer className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Shimmer className="h-5 w-20 rounded" />
                <Shimmer className="h-3 w-3" />
                <Shimmer className="h-5 w-20 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonDateGroup() {
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-3 mb-1">
        <Shimmer className="h-4 w-20" />
        <div className="flex-1 h-px bg-gray-100" />
      </div>
    </div>
  );
}

export function SkeletonSidebar() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shimmer className="w-8 h-8 rounded-lg" />
        <div>
          <Shimmer className="h-4 w-28 mb-1" />
          <Shimmer className="h-3 w-20" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 py-3 border-t border-gray-50">
          <Shimmer className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex-1">
            <Shimmer className="h-3 w-36 mb-1" />
            <Shimmer className="h-3 w-28 mb-1" />
            <Shimmer className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
