import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { LocationCoords } from '../services/location.service';
import { watchLocation } from '../services/location.service';
import type * as Location from 'expo-location';

interface LocationContextType {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isTracking: boolean;
  hasLocation: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      subscription = await watchLocation(
        (location) => {
          setCoords(location);
          setError(null);
          setIsTracking(true);
        },
        (err) => {
          setError(err);
          setIsTracking(false);
        }
      );

      if (!subscription) {
        setIsTracking(false);
      }
    };

    startTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const value: LocationContextType = {
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    accuracy: coords?.accuracy ?? null,
    error,
    isTracking,
    hasLocation: coords !== null,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
