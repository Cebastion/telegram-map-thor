const InitMapTest = (mapInitialized, mapRef, userLocation) => {
  const ymaps = window.ymaps

  ymaps.ready(() => {
    if (mapInitialized.current || !userLocation) return

    const map = new ymaps.Map(mapRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 20,
    })

    mapInitialized.current = true

    const placemark = new ymaps.Placemark(
      [userLocation.latitude, userLocation.longitude],
      {
        balloonContent: 'Вы здесь',
      },
      {
        preset: 'islands#icon',
        iconColor: '#0095b6',
      }
    )

    map.geoObjects.add(placemark)

    //map.setCenter([userLocation.latitude, userLocation.longitude])

    mapRef.current.mapInstance = map
    mapRef.current.placemark = placemark
  })
}

export { InitMapTest }