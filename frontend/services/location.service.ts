import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<LocationCoords | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

export async function watchLocation(
  onUpdate: (coords: LocationCoords) => void,
  onError?: (error: string) => void
): Promise<Location.LocationSubscription | null> {
  const granted = await requestLocationPermission();
  if (!granted) {
    onError?.('Location permission denied');
    return null;
  }

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 50,
      timeInterval: 10000,
    },
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    }
  );
}
