'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { destinationsApi } from '@/lib/api';
import { Destination } from '@/types';
import { useMemo } from 'react';
import { DestinationCard } from './DestinationCard';
import { useTripPlanningStore } from '@/store/tripPlanning';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DestinationList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { activeTrip, clearActiveTrip } = useTripPlanningStore();

  const router = useRouter();

  const { data: allDestinations = [], isLoading } = useQuery({
    queryKey: ['destinations', 'all'],
    queryFn: () => destinationsApi.getAllDestinations(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return allDestinations;

    const query = searchQuery.toLowerCase();
    return allDestinations.filter((destination) =>
      destination.name.toLowerCase().includes(query)
    );
  }, [allDestinations, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Explore Destinations
        </h1>

        {activeTrip && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-center space-x-3">
              <span className="text-blue-800 font-medium">
                🎯 Planning: {activeTrip.name}
              </span>
              <span className="text-blue-600 text-sm">
                {activeTrip.destinations?.length || 0} destination
                {(activeTrip.destinations?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href={`/dashboard/trips/${activeTrip.id}`}
                className="px-3 py-1 text-sm text-blue-700 hover:text-blue-800"
              >
                View Trip
              </Link>
              <button
                onClick={() => {
                  clearActiveTrip();
                  router.push('/dashboard');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                Back to Trips
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="max-w-lg">
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 border border-l-0 border-gray-300 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDestinations.map((destination: Destination) => (
          <DestinationCard key={destination.id} destination={destination} />
        ))}
      </div>
    </div>
  );
}

// function DestinationCard({ destination }: { destination: Destination }) {
//   return (
//     <div className="bg-white rounded-lg border border-gray-300 overflow-hidden hover:shadow-lg transition-shadow h-[380px] flex flex-col">
//       <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center relative flex-shrink-0">
//         {destination.imageUrl ? (
//           <img
//             src={destination.imageUrl}
//             alt={destination.name}
//             className="w-full h-full object-cover"
//           />
//         ) : (
//           <div className="text-center text-white">
//             <h3 className="text-2xl font-bold">{destination.name}</h3>
//             <p className="text-sm opacity-90">{destination.country}</p>
//           </div>
//         )}

//         {destination.imageUrl && (
//           <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
//             <div className="text-center text-white">
//               <h3 className="text-2xl font-bold">{destination.name}</h3>
//               <p className="text-sm opacity-90">{destination.country}</p>
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="p-6 flex flex-col flex-1">
//         <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1 overflow-hidden">
//           <span className="line-clamp-4">{destination.description}</span>
//         </p>

//         <div className="mt-auto space-y-4">
//           {destination.coordinates && (
//             <p className="text-xs text-gray-500">
//               📍 {destination.coordinates.latitude.toFixed(4)},{' '}
//               {destination.coordinates.longitude.toFixed(4)}
//             </p>
//           )}

//           <button className="w-full px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
//             Add to Trip
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
