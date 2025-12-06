// Location and Permissions Service for Radar Feature

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable';

/**
 * Check the current permission status for geolocation
 */
export const checkLocationPermission = async (): Promise<PermissionStatus> => {
  // Check if geolocation API is available
  if (!('geolocation' in navigator)) {
    return 'unavailable';
  }

  // Check if Permissions API is available
  if (!('permissions' in navigator)) {
    // Fallback for browsers without Permissions API
    return 'prompt';
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state as PermissionStatus;
  } catch (error) {
    console.warn('Could not query permissions:', error);
    return 'prompt';
  }
};

/**
 * Request location permission and get current position
 */
export const requestLocationPermission = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = 'Location permission denied';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable it in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Watch user location for continuous updates (useful for active radar session)
 */
export const watchLocationUpdates = (
  onSuccess: (coords: LocationCoordinates) => void,
  onError: (error: string) => void
): number => {
  if (!('geolocation' in navigator)) {
    onError('Geolocation is not supported by this browser.');
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => {
      let errorMessage = 'Location watch error';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location update timed out.';
          break;
      }

      onError(errorMessage);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }
  );
};

/**
 * Stop watching location updates
 */
export const stopLocationWatch = (watchId: number): void => {
  if (watchId >= 0 && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula (in kilometers)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
