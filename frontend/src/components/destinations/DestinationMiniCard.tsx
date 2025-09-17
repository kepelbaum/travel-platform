import { Destination } from '@/types';
import Image from 'next/image';

interface DestinationMiniCardProps {
  destination: Destination;
  onRemove?: () => void;
  activityImage?: string | null;
}

export function DestinationMiniCard({
  destination,
  onRemove,
  activityImage,
}: DestinationMiniCardProps) {
  // Determine which image to use
  const getBackgroundImage = () => {
    // Priority: destination image > activity image > gradient fallback
    if (destination.imageUrl) {
      return destination.imageUrl;
    }
    if (activityImage) {
      return activityImage;
    }
    return null; // Will use gradient fallback
  };

  const backgroundImage = getBackgroundImage();

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden group hover:shadow-md transition-shadow h-32">
      {backgroundImage ? (
        <div className="relative w-full h-full">
          <Image
            src={backgroundImage}
            alt={destination.name}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="text-white">
              <h3 className="font-semibold text-base mb-1">
                {destination.name}
              </h3>
              <p className="text-xs opacity-90">{destination.country}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <div className="text-center text-white p-3">
            <h3 className="font-semibold text-base mb-1">{destination.name}</h3>
            <p className="text-xs opacity-90">{destination.country}</p>
          </div>
        </div>
      )}

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold shadow-lg"
          title={`Remove ${destination.name}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
