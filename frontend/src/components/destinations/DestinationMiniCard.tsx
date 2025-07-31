import { Destination } from '@/types';

interface DestinationMiniCardProps {
  destination: Destination;
  onRemove?: () => void;
}

export function DestinationMiniCard({
  destination,
  onRemove,
}: DestinationMiniCardProps) {
  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden group hover:shadow-md transition-shadow h-32">
      <div className="absolute inset-0">
        {destination.imageUrl ? (
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
        <div>
          <h3 className="font-semibold text-lg mb-1 drop-shadow-sm">
            {destination.name}
          </h3>
          <p className="text-sm opacity-90 drop-shadow-sm">
            {destination.country}
          </p>
        </div>

        {onRemove && (
          <button
            onClick={onRemove} //TODO: implement destination deletion IF necessary (UI overhaul imminent)
            className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            title="Remove destination"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
