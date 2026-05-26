import { Shimmer } from '@/components/shared/Shimmer';

export function MarketplaceShimmer() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <Shimmer className="w-8 h-8 rounded-lg" />
            <Shimmer className="h-10 w-48 rounded-lg" />
          </div>
          <Shimmer className="h-5 w-96 rounded-lg" />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Shimmer className="h-12 flex-1 rounded-xl" />
          <Shimmer className="h-12 w-full sm:w-48 rounded-xl" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Shimmer key={i} className="h-24 rounded-xl" />
          ))}
        </div>

        {/* Listings Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <Shimmer className="aspect-square w-full" />
              <div className="p-4 space-y-3">
                <Shimmer className="h-6 w-3/4 rounded-lg" />
                <div className="flex gap-2">
                  <Shimmer className="h-4 w-12 rounded-full" />
                  <Shimmer className="h-4 w-12 rounded-full" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Shimmer className="h-4 w-24 rounded-lg" />
                  <Shimmer className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
