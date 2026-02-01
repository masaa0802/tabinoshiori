"use client";

import { useJsApiLoader } from '@react-google-maps/api';
import { createContext, useContext, ReactNode } from 'react';

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ['places'];

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError?: Error;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
