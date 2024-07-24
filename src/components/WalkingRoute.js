import React, { useRef, useState, useEffect } from 'react';
import { YMaps, Map, Button } from '@pbe/react-yandex-maps';
import style from './WalkingRoute.module.scss';

const WalkingRoute = ({ points }) => {
  const mapRef = useRef(null);
  const ymapsRef = useRef(null);
  const [routeVisible, setRouteVisible] = useState(false);
  const [multiRoute, setMultiRoute] = useState(null);
  const [reachedPoints, setReachedPoints] = useState(new Set());
  const [currentPosition, setCurrentPosition] = useState(null);

  // Функция для записи сообщения в консоль
  const logToConsole = (message) => {
    console.log(message);
  };

  // Функция для вычисления угла между двумя векторами
  const calculateAngle = (v1, v2) => {
    const dotProduct = v1[0] * v2[0] + v1[1] * v2[1];
    const magnitude1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    const magnitude2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
    const angle = Math.acos(dotProduct / (magnitude1 * magnitude2));
    return (angle * 180) / Math.PI; // Конвертация в градусы
  };

  // Функция для инициализации маршрута
  const initializeRoute = async () => {
    console.log('Initializing route...');
    if (ymapsRef.current && mapRef.current) {
      const ymaps = ymapsRef.current;
      const map = mapRef.current;

      try {
        const [MultiRoute] = await ymaps.modules.require(['multiRouter.MultiRoute']);

        if (multiRoute) {
          console.log('Removing previous route...');
          map.geoObjects.remove(multiRoute);
        }

        const newMultiRoute = new MultiRoute({
          referencePoints: [currentPosition, ...points],
          params: {
            routingMode: 'pedestrian'
          }
        }, {
          boundsAutoApply: true
        });

        map.geoObjects.add(newMultiRoute);
        setMultiRoute(newMultiRoute);
        console.log('New route added.');

        newMultiRoute.events.add('update', () => {
          console.log('Route updated.');
          const activeRoute = newMultiRoute.getActiveRoute();
          if (activeRoute) {
            console.log('Active route found.');
            const paths = activeRoute.getPaths();
            
            paths.each((path) => {
              const segments = path.getSegments();
              let previousSegmentEnd = null;

              segments.each((segment, index) => {
                let pointPosition = segment.geometry.getCoordinates();
                console.log(`Segment ${index + 1} coordinates:`, pointPosition);

                // Проверка на NaN
                if (isNaN(pointPosition[0]) || isNaN(pointPosition[1])) {
                  pointPosition = previousSegmentEnd || points[0]; // Используем предыдущую точку или начальную точку
                  console.log(`Segment ${index + 1} had NaN coordinates, using fallback coordinates:`, pointPosition);
                }

                const checkPointReached = () => {
                  console.log(`Current position:`, currentPosition);
                  console.log(`pointPosition position:`, pointPosition);
                  const distance = ymaps.coordSystem.geo.getDistance(currentPosition, pointPosition);
                  console.log(`Distance to point ${index + 1}:`, distance);

                  if (distance < 50 && !reachedPoints.has(index)) {
                    logToConsole(`Reached point ${index + 1}`);
                    setReachedPoints(prev => new Set(prev.add(index)));
                  }

                  if (previousSegmentEnd) {
                    const v1 = [previousSegmentEnd[0] - currentPosition[0], previousSegmentEnd[1] - currentPosition[1]];
                    const v2 = [pointPosition[0] - currentPosition[0], pointPosition[1] - currentPosition[1]];
                    const angle = calculateAngle(v1, v2);
                    if (angle > 30) { // Угол больше 30 градусов считается поворотом
                      logToConsole(`Turn detected at point ${index + 1}, angle: ${angle}`);
                    }
                  }
                  previousSegmentEnd = pointPosition;
                };

                // Проверка точки при каждом обновлении сегмента
                segment.events.add('geometrychange', () => {
                  console.log(`Segment ${index + 1} geometry changed.`);
                  checkPointReached();
                });

                // Проверка точки сразу после создания маршрута
                checkPointReached();
              });
            });
          } else {
            console.log('No active route found.');
          }
        });
      } catch (error) {
        console.error('Error loading MultiRoute module:', error);
      }
    } else {
      console.log('YMaps or map is not ready.');
    }
  };

  // Функция для очистки маршрута
  const cleanupRoute = () => {
    console.log('Cleaning up route...');
    if (mapRef.current) {
      mapRef.current.geoObjects.removeAll();
    }
    setMultiRoute(null);
    setReachedPoints(new Set());
  };

  // Функция для обработки нажатия на кнопку
  const handleButtonClick = () => {
    console.log('Button clicked. Route visible:', routeVisible);
    if (routeVisible) {
      cleanupRoute();
    } else {
      initializeRoute();
    }
    setRouteVisible(!routeVisible);
  };

  // Обновление текущего местоположения пользователя
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position.coords;
          const newPosition = [latitude, longitude];
          console.log('New position:', newPosition);
          setCurrentPosition(newPosition);
        },
        error => {
          console.error('Error getting current position:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      console.error('Geolocation is not available in this browser.');
    }
  }, []);

  return (
    <YMaps query={{ apikey: '2af4a372-b170-4a63-8e82-b904996bd01c', load: 'package.full' }}>
      <Map
        defaultState={{ center: [55.76492700000001, 37.62373199999999], zoom: 14 }}
        instanceRef={map => mapRef.current = map}
        onLoad={ymaps => ymapsRef.current = ymaps}
        className={style.map}
        modules={['control.Button']}
      >
        <Button
          options={{ maxWidth: 128 }}
          data={{ content: routeVisible ? "Stop Route" : "Start Route" }}
          defaultState={{ selected: false }}
          onClick={handleButtonClick}
        />
      </Map>
    </YMaps>
  );
};

export default WalkingRoute;
