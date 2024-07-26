import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getData } from '../API/api.service';
import './Modal.css'; // Импортируйте файл стилей для модального окна

const Distance = 503837.4250935229 // ТУТ МЕНЯЕМ РАССТОЯНИЕ
const timeout = 4000;

const getUserLocation = (setUserLocation) => {
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
    if (mapInitialized.current || !userLocation) return;

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

const playAudioWithRetry = (audioRef, url, retries = 5) => {
  const playAttempt = () => {
    audioRef.current.src = '/music/ElevenLabs_2024_07_25T20_38_48_Artem_Kesso_pvc_s74_sb53_se27_b_m2.mp3';
    audioRef.current.play().catch(error => {
      console.error('Audio playback failed:', error);
      if (retries > 0) {
        setTimeout(() => playAudioWithRetry(audioRef, url, retries - 1), timeout);
      }
    });
  };
  playAttempt();
};

const addRoute = (mapRef, userLocation, audioRef, visitedPoints, points) => {
  const ymaps = window.ymaps;

  if (!mapRef.current || !mapRef.current.mapInstance) {
    console.error("Map instance is not initialized.");
    return;
  }

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
    if (mapRef.current.placemark) {
      mapRef.current.placemark.geometry.setCoordinates([newLocation.latitude, newLocation.longitude]);
      map.setCenter([newLocation.latitude, newLocation.longitude]);
    }

    points.forEach((point, index) => {
      const distance = getDistanceFromLatLonInMeters(
        newLocation.latitude,
        newLocation.longitude,
        point.latitude,
        point.longitude
      );

      if (distance <= Distance && !visitedPoints.current[index]) { // Adjust the distance as needed
        visitedPoints.current[index] = true;
        playAudioWithRetry(audioRef, point.url);
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
  const [routeAdded, setRouteAdded] = useState(false); // State for tracking if the route is added
  const mapRef = useRef(null);
  const mapInitialized = useRef(false);
  const audioRef = useRef(null);
  const visitedPoints = useRef([]); // Отслеживание посещенных точек
  const { NameThor } = useParams();

  useEffect(() => {
    getData(NameThor).then((data) => {
      setPoints(data);
      visitedPoints.current = Array(data.length).fill(false); // Инициализация массива посещенных точек
    });
  }, [showModal]);

  const handleStartRoute = () => {
    setShowModal(false);
    getUserLocation(setUserLocation);

    // Initiate an empty audio play to allow later playback
    audioRef.current.play().catch(error => {
      console.error('Initial audio play failed:', error);
    }); 
  };

  useEffect(() => {
    if (userLocation && !mapInitialized.current) {
      initMap(mapInitialized, mapRef, userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    if (showModal) return;

    if (mapInitialized.current && userLocation && points.length > 0 && !routeAdded) {
      // Run the points.forEach logic only once here
      points.forEach((point, index) => {
        const distance = getDistanceFromLatLonInMeters(
          userLocation.latitude,
          userLocation.longitude,
          point.latitude,
          point.longitude
        );

        console.log(distance)

        if (distance <= Distance && !visitedPoints.current[index]) { // Adjust the distance as needed
          visitedPoints.current[index] = true;
          alert(`Точка ${index + 1} посещена!`);
          playAudioWithRetry(audioRef, point.url);
        }
      });

      addRoute(mapRef, userLocation, audioRef, visitedPoints, points);
      setRouteAdded(true); // Set routeAdded to true after the route is added
    }
  }, [showModal, userLocation, points, mapInitialized.current, routeAdded]);

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
      <audio ref={audioRef} preload="auto" />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Тур: {NameThor ? NameThor : '1'}</h2>
            <button onClick={handleStartRoute}>Начать маршрут</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Map;
