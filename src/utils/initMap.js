import { speak } from './speechSynthesis'

export const initMap = (mapInitialized, mapRef, userLocation) => {
  const ymaps = window.ymaps;

  ymaps.ready(() => {
    if (mapInitialized.current) return; // Если карта уже инициализирована, ничего не делаем

    const map = new ymaps.Map(mapRef.current, {
      center: [55.751574, 37.573856],
      zoom: 9,
    });

    // Устанавливаем флаг инициализации карты
    mapInitialized.current = true;

    if (userLocation) {
      const multiRoute = new ymaps.multiRouter.MultiRoute({
        referencePoints: [
          [userLocation.latitude, userLocation.longitude], // Координаты начальной точки
          [55.758611, 37.62047]   // Координаты конечной точки
        ],
        params: {
          results: 1
        }
      }, {
        boundsAutoApply: true
      });

      map.geoObjects.add(multiRoute);

      multiRoute.model.events.add('requestsuccess', () => {
        const activeRoute = multiRoute.getActiveRoute();
        if (activeRoute) {
          activeRoute.getPaths().each((path) => {
            path.getSegments().each((segment) => {
              const instruction = segment.properties.get('text');
              speak(instruction);
            });
          });
        }
      });
    }
  });
};