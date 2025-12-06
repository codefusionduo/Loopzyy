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
 * Request location permission and get current position with retry logic
 */
export const requestLocationPermission = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    // First attempt with high accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        // If high accuracy fails, retry with lower accuracy
        if (error.code === error.POSITION_UNAVAILABLE) {
          console.warn('High accuracy location unavailable, retrying with lower accuracy...');
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
            },
            (retryError) => {
              let errorMessage = 'Location permission denied';

              switch (retryError.code) {
                case retryError.PERMISSION_DENIED:
                  errorMessage = 'Location permission denied. Please enable it in your browser settings.';
                  break;
                case retryError.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information is unavailable. Please enable location services or try again.';
                  break;
                case retryError.TIMEOUT:
                  errorMessage = 'Location request timed out. Please check your connection.';
                  break;
              }

              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: false, // Lower accuracy for retry
              timeout: 15000,
              maximumAge: 60000, // Allow cached location up to 1 minute
            }
          );
        } else {
          let errorMessage = 'Location permission denied';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable it in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please check your connection.';
              break;
          }

          reject(new Error(errorMessage));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
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

/**
 * Get approximate location based on IP address (fallback)
 * Returns a promise that resolves with approximate coordinates
 */
export const getApproximateLocationByIP = async (): Promise<LocationCoordinates> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('IP geolocation failed');
    
    const data = await response.json();
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: 5000, // ~5km accuracy for IP-based location
    };
  } catch (error) {
    console.warn('IP-based geolocation failed:', error);
    throw new Error('Could not determine location. Please check your internet connection or enable location services.');
  }
};

