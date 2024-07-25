import React, { useEffect, useRef, useState } from 'react';

const points = [
  { latitude: 48.495767, longitude: 34.640591 },
  { latitude: 48.502781, longitude: 34.630121 },
  { latitude: 48.520116, longitude: 34.615680 },
  { latitude: 48.519363, longitude: 34.615679 },
  { latitude: 48.515801, longitude: 34.613854 },
  // { latitude: 55.758611, longitude: 37.62047 },
  // { latitude: 55.751574, longitude: 37.573856 }
];

// Функция для получения координат пользователя
const GetUserLocation = (setUserLocation) => {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      },
      (error) => {
        console.error('Error getting user location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
};

// Функция для расчета расстояния между двумя координатами (в метрах)
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon1 - lon2) * Math.PI) / 180;
  const a =
    0.5 - Math.cos(dLat) / 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * (1 - Math.cos(dLon)) / 2;

  return R * 2 * Math.asin(Math.sqrt(a));
};

// Функция для инициализации карты
const initMap = (mapInitialized, mapRef, userLocation, audioRef) => {
  const ymaps = window.ymaps;

  ymaps.ready(() => {
    if (mapInitialized.current) return;

    const map = new ymaps.Map(mapRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 9,
    });

    mapInitialized.current = true;

    const placemark = new ymaps.Placemark(
      [userLocation.latitude, userLocation.longitude],
      {
        balloonContent: 'Вы здесь',
      },
      {
        preset: 'islands#icon',
        iconColor: '#0095b6',
      }
    );

    map.geoObjects.add(placemark);

    const multiRoute = new ymaps.multiRouter.MultiRoute({
      referencePoints: points.map(point => [point.latitude, point.longitude]),
      params: {
        routingMode: 'pedestrian',
        results: 1
      }
    }, {
      boundsAutoApply: false
    });

    map.geoObjects.add(multiRoute);
    map.setCenter([userLocation.latitude, userLocation.longitude]);

    const updatePlacemark = (newLocation) => {
      placemark.geometry.setCoordinates([newLocation.latitude, newLocation.longitude]);
      map.setCenter([newLocation.latitude, newLocation.longitude]);
    
      // Перебор всех точек и проверка расстояния до каждой из них
      const isCloseToAnyPoint = points.some(point => {
        const distance = getDistanceFromLatLonInMeters(
          newLocation.latitude,
          newLocation.longitude,
          point.latitude,
          point.longitude
        );
        return distance <= 50;
      });
    
      if (isCloseToAnyPoint) {
        console.log("Мы на точке")
        alert("Мы на точке");
        audioRef.current.play().catch(error => console.error('Audio playback failed:', error));
      }
    };

    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updatePlacemark({ latitude, longitude });
      },
      (error) => {
        console.error('Error watching user location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

const Map = () => {
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const mapInitialized = useRef(false);
  const audioRef = useRef(null);
  const userInteracted = useRef(false);

  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted.current) {
        audioRef.current.play().catch(error => console.error('Audio playback failed:', error));
        console.log('Выстпед в воздух');
        alert("Выстпед в воздух");
        userInteracted.current = true;
      }
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    GetUserLocation(setUserLocation);
    if (userLocation && !mapInitialized.current) {
      initMap(mapInitialized, mapRef, userLocation, audioRef);
    }
  }, [userLocation]);

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
      <audio ref={audioRef} src="/music/puk.mp3" preload="auto" />
    </>
  );
};

export default Map;
