import React, { useEffect, useRef, useState } from 'react';
import { getData } from '../API/api.service';
import './Modal.css'; // Импортируйте файл стилей для модального окна

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

const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon1 - lon2) * Math.PI) / 180;
  const a =
    0.5 - Math.cos(dLat) / 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * (1 - Math.cos(dLon)) / 2;

  return R * 2 * Math.asin(Math.sqrt(a));
};

const initMap = (mapInitialized, mapRef, userLocation) => {
  const ymaps = window.ymaps;

  ymaps.ready(() => {
    if (mapInitialized.current) return;

    const map = new ymaps.Map(mapRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 20,
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

    map.setCenter([userLocation.latitude, userLocation.longitude]);

    mapRef.current.mapInstance = map;
    mapRef.current.placemark = placemark;
  });
};

const addRoute = (mapRef, userLocation, audioRef, visitedPoints, points) => {
  const ymaps = window.ymaps;

  const map = mapRef.current.mapInstance;

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

  const updatePlacemark = (newLocation) => {
    mapRef.current.placemark.geometry.setCoordinates([newLocation.latitude, newLocation.longitude]);
    map.setCenter([newLocation.latitude, newLocation.longitude]);

    points.forEach((point, index) => {
      const distance = getDistanceFromLatLonInMeters(
        newLocation.latitude,
        newLocation.longitude,
        point.latitude,
        point.longitude
      );

      if (distance <= 200 && !visitedPoints.current[index]) {
        visitedPoints.current[index] = true;
        audioRef.current.src = point.url;
        audioRef.current.play().catch(error => console.error('Audio playback failed:', error));
        // alert(`Вы посетили точку ${index + 1}`);
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
};

const Map = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [points, setPoints] = useState([]);
  const [showModal, setShowModal] = useState(true); // State for modal visibility
  const mapRef = useRef(null);
  const mapInitialized = useRef(false);
  const audioRef = useRef(null);
  const visitedPoints = useRef([]); // Отслеживание посещенных точек

  useEffect(() => {
    getData().then((data) => {
      setPoints(data);
      visitedPoints.current = Array(data.length).fill(false); // Инициализация массива посещенных точек
    });

    GetUserLocation(setUserLocation);
  }, []);

  useEffect(() => {
    if (userLocation && !mapInitialized.current) {
      initMap(mapInitialized, mapRef, userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    if (userLocation && points.length > 0 && !showModal) {
      addRoute(mapRef, userLocation, audioRef, visitedPoints, points);
    }
  }, [userLocation, points, showModal]);

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
      <audio ref={audioRef} preload="auto" />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Навигация</h2>
            <button onClick={() => setShowModal(false)}>Начать маршрут</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Map;
