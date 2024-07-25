import React, { useEffect, useRef, useState } from 'react';
import { getData } from '../API/api.service';

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

    console.log(R * 2 * Math.asin(Math.sqrt(a)))

  return R * 2 * Math.asin(Math.sqrt(a));
};

// Функция для инициализации карты
const initMap = (mapInitialized, mapRef, userLocation, audioRef, visitedPoints, points) => {
  const ymaps = window.ymaps;

  ymaps.ready(() => {
    if (mapInitialized.current) return;

    const map = new ymaps.Map(mapRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 10,
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
      points.forEach((point, index) => {
        const distance = getDistanceFromLatLonInMeters(
          newLocation.latitude,
          newLocation.longitude,
          point.latitude,
          point.longitude
        );

        if (distance <= 8089572.104910173 && !visitedPoints.current[index]) {
          visitedPoints.current[index] = true;
          audioRef.current.src = point.url;
          audioRef.current.play().catch(error => console.error('Audio playback failed:', error));
          alert(`Вы посетили точку ${index + 1}`);
        }
      });
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
  const [points, setPoints] = useState([]);
  const mapRef = useRef(null);
  const mapInitialized = useRef(false);
  const TestAudio = useRef(false);
  const audioRef = useRef(null);
  const visitedPoints = useRef([]); // Отслеживание посещенных точек

  useEffect(() => {
    const handleInteraction = () => {
      if (TestAudio.current) return;
      TestAudio.current = true;
      alert('Тестовое уведомление');
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    // Получение данных при монтировании компонента
    getData().then((data) => {
      setPoints(data);
      visitedPoints.current = Array(data.length).fill(false); // Инициализация массива посещенных точек
    });

    GetUserLocation(setUserLocation);
  }, []);

  useEffect(() => {
    if (userLocation && points.length > 0 && !mapInitialized.current) {
      initMap(mapInitialized, mapRef, userLocation, audioRef, visitedPoints, points);
    }
  }, [userLocation, points]);

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
      <audio ref={audioRef} preload="auto" />
    </>
  );
};

export default Map;
