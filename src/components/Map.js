import React, { useEffect, useRef, useState } from 'react';
import { GetUserLocation } from '../utils/GetUserLocation'
import { initMap } from '../utils/initMap'

const Map = () => {
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const mapInitialized = useRef(false);

  useEffect(() => {
    GetUserLocation(setUserLocation);
    if (userLocation && !mapInitialized.current) {
      initMap(mapInitialized, mapRef, userLocation);
    }

  }, [userLocation]);

  return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
};

export default Map;
