export const GetUserLocation = (setUserLocation) => {
  if (navigator.geolocation) {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      },
      (error) => {
        console.error('Error getting user location:', error);
      },
      {
        enableHighAccuracy: true, // Использовать высокую точность (например, GPS)
        timeout: 10000, // Время ожидания получения данных о местоположении
        maximumAge: 0 // Не использовать кэшированные данные
      }
    );
    return watchId;
  } else {
    console.error('Geolocation is not supported by this browser.');
    return null;
  }
};
