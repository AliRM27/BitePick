import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
}

/**
 * Custom hook for getting device location.
 * Requests permission and fetches current position on demand.
 */
export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
    permissionStatus: null,
  });

  // Check existing permission on mount (don't request yet)
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));
    })();
  }, []);

  /**
   * Request location permission and get the current position.
   * Returns the coordinates or null if permission denied / error.
   */
  const getLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Request permission if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));

      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Location permission denied. Please enable it in Settings.',
        }));
        return null;
      }

      // Try last known position first (instant, avoids GPS wait)
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown && Date.now() - lastKnown.timestamp < 5 * 60 * 1000) {
        // Use cached position if less than 5 minutes old
        const { latitude, longitude } = lastKnown.coords;

        setState((prev) => ({
          ...prev,
          latitude,
          longitude,
          loading: false,
          error: null,
        }));

        return { latitude, longitude };
      }

      // Fall back to fresh position with a timeout to avoid hanging
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Location request timed out. Please try again.')), 15000),
      );

      const location = await Promise.race([locationPromise, timeoutPromise]);

      const { latitude, longitude } = location.coords;

      setState((prev) => ({
        ...prev,
        latitude,
        longitude,
        loading: false,
        error: null,
      }));

      return { latitude, longitude };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to get location';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  return {
    ...state,
    getLocation,
  };
}
