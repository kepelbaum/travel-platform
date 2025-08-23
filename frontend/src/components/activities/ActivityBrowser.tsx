'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ActivityCard from './ActivityCard';
import { Activity } from '@/types';
import { activitiesApi } from '@/lib/api';

interface ActivityBrowserProps {
  destinationId: number;
  tripId?: number;
}

interface PaginatedActivityResponse {
  activities: Activity[];
  count: number;
  totalCount?: number;
  hasMore?: boolean;
  currentPage?: number;
  source: string;
}

export default function ActivityBrowser({
  destinationId,
  tripId,
}: ActivityBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Dynamic query based on search/category
  const queryKey = searchQuery
    ? ['activities', destinationId, 'search', searchQuery, page]
    : ['activities', destinationId, selectedCategory, page];

  const queryFn = async () => {
    if (searchQuery) {
      return activitiesApi.searchActivitiesPaginated(
        destinationId,
        searchQuery,
        { page }
      );
    } else {
      return activitiesApi.getActivitiesPaginated(destinationId, {
        page,
        category: selectedCategory,
      });
    }
  };

  const { data: categories } = useQuery({
    queryKey: ['activity-categories'],
    queryFn: () => activitiesApi.getCategories(),
  });

  const {
    data: activityResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<PaginatedActivityResponse>({
    queryKey,
    queryFn,
  });

  const activities = activityResponse?.activities || [];

  const handleForceRefresh = async () => {
    await activitiesApi.refreshActivities(destinationId);
    refetch();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search
    setPage(1); // Reset to first page
  };

  const loadMoreActivities = () => {
    setPage((prev) => prev + 1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-80 bg-gray-200 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load activities</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with cache info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activities</h2>
          <p className="text-sm text-gray-500">
            {activityResponse?.totalCount || activityResponse?.count} total
            activities •
            {activityResponse?.source === 'cached'
              ? ' Cached'
              : ' Fresh from Google'}{' '}
            • Page {activityResponse?.currentPage || page}
          </p>
        </div>
        <button
          onClick={handleForceRefresh}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Search and filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories?.map((cat: string) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Quick filters */}
        <div className="flex gap-2">
          {['attraction', 'restaurant', 'museum'].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {cat === 'attraction'
                ? '🏛️ Attractions'
                : cat === 'restaurant'
                  ? '🍽️ Dining'
                  : '🎨 Museums'}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity: Activity) => (
          <ActivityCard key={activity.id} activity={activity} tripId={tripId} />
        ))}
      </div>

      {/* Load More */}
      {activityResponse?.hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={loadMoreActivities}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More Activities'}
          </button>
        </div>
      )}

      {activities.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p>No activities found. Try adjusting your search.</p>
        </div>
      )}
      {/* Pagination Info */}
      <div className="flex justify-between items-center py-4">
        <div className="text-sm text-gray-600">
          Showing {activities.length} of {activityResponse?.totalCount || 0}{' '}
          activities
          {page > 1 && ` (Page ${page})`}
        </div>

        {page > 1 && (
          <button
            onClick={() => setPage(1)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Page 1
          </button>
        )}
      </div>
    </div>
  );
}
