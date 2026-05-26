export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-card rounded-lg ${className}`} />
  );
}

export function PageShimmer() {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column - Image */}
        <div className="space-y-8">
          <Shimmer className="aspect-square w-full rounded-3xl" />
          <div className="grid grid-cols-2 gap-4">
            <Shimmer className="h-24 rounded-2xl" />
            <Shimmer className="h-24 rounded-2xl" />
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <Shimmer className="h-12 w-3/4 rounded-xl" />
            <Shimmer className="h-6 w-1/2 rounded-lg" />
          </div>

          <div className="space-y-4 pt-8 border-t border-border">
            <Shimmer className="h-32 w-full rounded-2xl" />
            <div className="flex gap-4">
              <Shimmer className="h-14 flex-1 rounded-xl" />
              <Shimmer className="h-14 w-14 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
