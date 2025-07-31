import { Trip } from '@/types';

interface DeleteTripModalProps {
  trip: Trip;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTripModal({
  trip,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteTripModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Trip</h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete "{trip.name}"? This action cannot be
          undone.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
