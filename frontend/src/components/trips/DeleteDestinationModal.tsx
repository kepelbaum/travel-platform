import { useThemeStore } from '@/store/theme';

interface DeleteDestinationModalProps {
  destinationName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteDestinationModal({
  destinationName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteDestinationModalProps) {
  const { isDark } = useThemeStore();

  return (
    <div
      className={`fixed inset-0 overflow-y-auto h-full w-full flex items-center justify-center z-50 ${
        isDark ? 'bg-black bg-opacity-50' : 'bg-gray-600 bg-opacity-50'
      }`}
    >
      <div
        className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border transition-colors ${
          isDark
            ? 'bg-gray-800 border-gray-700 shadow-purple-500/25'
            : 'bg-white border-gray-300 shadow-gray-400/20'
        }`}
      >
        <h3
          className={`text-lg font-medium mb-4 ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          Remove Destination
        </h3>

        <p
          className={`text-sm mb-6 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          Are you sure you want to remove "{destinationName}" from this trip?
          This will also remove all associated activities.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`group flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-all duration-200 space-x-2 ${
              isDeleting
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:shadow-lg hover:shadow-red-500/25'
            } text-white bg-red-600 hover:bg-red-700`}
          >
            {isDeleting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isDeleting ? 'Removing...' : 'Remove'}</span>
          </button>

          <button
            onClick={onCancel}
            className={`flex-1 inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              isDark
                ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 hover:shadow-lg'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:shadow-lg'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
