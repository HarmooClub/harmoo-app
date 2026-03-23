import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationState {
  location: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useLocation(): LocationState {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if running on web
      if (Platform.OS === 'web') {
        // Try browser geolocation
        if ('geolocation' in navigator) {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setLocation({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
                setIsLoading(false);
                resolve(true);
              },
              (err) => {
                setError(err.message);
                setIsLoading(false);
                resolve(false);
              }
            );
          });
        } else {
          setError('Geolocation not supported');
          setIsLoading(false);
          return false;
        }
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission denied');
        setIsLoading(false);
        return false;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      });
      
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
      setIsLoading(false);
      return false;
    }
  };

  return { location, error, isLoading, requestPermission };
}
