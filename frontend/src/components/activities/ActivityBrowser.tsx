'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ActivityCard from './ActivityCard';
import ActivityDetailsModal from './ActivityDetailsModal';
import { Activity } from '@/types';
import { activitiesApi, ActivitiesResponse } from '@/lib/api';

interface ActivityBrowserProps {
  destinationId: number;
  tripId?: number;
}

export default function ActivityBrowser({
  destinationId,
  tripId,
}: ActivityBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );

  // Simple API call - get all activities, do all filtering on frontend
  const queryKey = ['activities', destinationId];

  const queryFn = async (): Promise<ActivitiesResponse> => {
    return activitiesApi.getActivitiesSmart(destinationId);
  };

  const { data: categories } = useQuery({
    queryKey: ['activity-categories'],
    queryFn: () => activitiesApi.getCategories(),
  });

  const {
    data: ActivitiesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<ActivitiesResponse>({
    queryKey,
    queryFn,
    enabled: !!destinationId && destinationId !== undefined,
  });

  const allActivities = ActivitiesResponse?.activities || [];

  // Frontend filtering and pagination
  const processedActivities = useMemo(() => {
    let filtered = allActivities;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (activity: Activity) => activity.category === selectedCategory
      );
    }

    // Apply search filter - matches names that contain the search term
    if (searchQuery && searchQuery.length >= 2) {
      filtered = filtered.filter((activity: Activity) =>
        activity.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by rating and popularity combination, then by name
    filtered.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      const popularityA = a.userRatingsTotal || 0;
      const popularityB = b.userRatingsTotal || 0;

      // Calculate composite score: rating * log(popularity + 1)
      // This balances quality vs popularity
      const scoreA = ratingA * Math.log(popularityA + 1);
      const scoreB = ratingB * Math.log(popularityB + 1);

      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher score first
      }

      return a.name.localeCompare(b.name); // Alphabetical by name as tiebreaker
    });

    // Calculate pagination
    const startIndex = (page - 1) * 20;
    const endIndex = startIndex + 20;
    const paginatedActivities = filtered.slice(startIndex, endIndex);

    return {
      activities: paginatedActivities,
      filteredCount: filtered.length,
    };
  }, [allActivities, selectedCategory, searchQuery, page]);

  const totalCount = processedActivities.filteredCount;
  const currentPage = page;
  const totalPages = Math.ceil(totalCount / 20);

  const handleForceRefresh = async () => {
    await activitiesApi.refreshActivities(destinationId);
    refetch();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page when searching
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when changing category
    setPage(1); // Reset to first page
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between py-6">
        {/* Left: Results info */}
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * 20 + 1}-
          {Math.min(currentPage * 20, totalCount)} of {totalCount} activities
        </div>

        {/* Center: Page controls */}
        <div className="flex items-center space-x-2">
          {/* Previous button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {/* Always show first page */}
            {currentPage > 3 && (
              <>
                <button
                  onClick={() => goToPage(1)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  1
                </button>
                {currentPage > 4 && <span className="text-gray-400">...</span>}
              </>
            )}

            {/* Show pages around current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  disabled={isLoading}
                  className={`px-3 py-2 text-sm rounded-md ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Always show last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <span className="text-gray-400">...</span>
                )}
                <button
                  onClick={() => goToPage(totalPages)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        {/* Right: Quick jump */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Go to:</span>
          <select
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            className="px-2 py-1 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <option key={pageNum} value={pageNum}>
                  Page {pageNum}
                </option>
              )
            )}
          </select>
        </div>
      </div>
    );
  };

  if (isLoading && page === 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-96 bg-gray-200 rounded-lg animate-pulse"
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
      {/* Header with pagination info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activities</h2>
          <p className="text-sm text-gray-500">
            {totalCount} total activities • Page {currentPage} of {totalPages}
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
      <div className="bg-white border-2 border-gray-300 rounded-lg shadow-md p-5 space-y-4">
        <div className="flex items-center mb-3">
          <span className="text-lg mr-2">🔍</span>
          <h3 className="text-sm font-semibold text-gray-700">
            Search & Filter Activities
          </h3>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div>
          <p className="text-xs text-gray-600 mb-2">Quick filters:</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-3 py-1 rounded-full text-sm border-2 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
              }`}
            >
              📋 All
            </button>
            {categories?.map((cat: string) => {
              const getCategoryIcon = (category: string) => {
                const icons: Record<string, string> = {
                  Landmark: '🏛️',
                  Attraction: '🎢',
                  Museum: '🎨',
                  Restaurant: '🍽️',
                  Park: '🌳',
                  Nightlife: '🍻',
                  Shopping: '🛍️',
                  Other: '📋 ',
                };
                return icons[category] || '📋 ';
              };

              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1 rounded-full text-sm border-2 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
                  }`}
                >
                  {getCategoryIcon(cat)} {cat.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading overlay for page changes */}
      {isLoading && page > 1 && (
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading page {page}...</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {processedActivities.activities.map((activity: Activity) => (
          <div
            key={activity.id}
            className="border-2 border-gray-200 rounded-xl p-2 bg-white"
          >
            <ActivityCard
              activity={activity}
              tripId={tripId}
              onShowDetails={setSelectedActivity}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <PaginationControls />

      {processedActivities.activities.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p>No activities found. Try adjusting your search.</p>
        </div>
      )}

      {/* Activity Details Modal */}
      {selectedActivity && (
        <ActivityDetailsModal
          activity={selectedActivity}
          tripId={tripId}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
}
