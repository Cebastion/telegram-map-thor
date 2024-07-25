export const initMap = (mapInitialized, mapRef, userLocation) => {
  const ymaps = window.ymaps;

  ymaps.ready(() => {
    if (mapInitialized.current) return; // Если карта уже инициализирована, ничего не делаем

    const map = new ymaps.Map(mapRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 9,
    });

    // Устанавливаем флаг инициализации карты
    mapInitialized.current = true;

    const placemark = new ymaps.Placemark(
      [userLocation.latitude, userLocation.longitude], // Координаты маркера
      {
        balloonContent: 'Вы здесь', // Содержимое балуна при нажатии на маркер
      },
      {
        preset: 'islands#icon', // Внешний вид маркера
        iconColor: '#0095b6', // Цвет маркера
      }
    );

    // Добавляем маркер на карту
    map.geoObjects.add(placemark);

    const multiRoute = new ymaps.multiRouter.MultiRoute({
      referencePoints: [
        [55.758611, 37.62047],   // Координаты конечной точки
        [55.751574, 37.573856],  // Координаты начальной точки
      ],
      params: {
        results: 1
      }
    }, {
      boundsAutoApply: false
    });

    map.geoObjects.add(multiRoute);
    map.setCenter([userLocation.latitude, userLocation.longitude]);

    // Обновление положения маркера при изменении местоположения пользователя
    const updatePlacemark = (newLocation) => {
      placemark.geometry.setCoordinates([newLocation.latitude, newLocation.longitude]);
      map.setCenter([newLocation.latitude, newLocation.longitude]);
    };

    // Подписываемся на обновления местоположения
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updatePlacemark({ latitude, longitude });
      },
      (error) => {
        console.error('Error watching user location:', error);
      },
      {
        enableHighAccuracy: true, // Использовать высокую точность
        timeout: 10000, // Время ожидания получения данных о местоположении
        maximumAge: 0 // Не использовать кэшированные данные
      }
    );
  });
};
