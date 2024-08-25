import { GetDistanceFromLatLonInMeters } from './GetDistanceFromLatLonInMeters.util'
import { PlayAudioWithRetry } from './PlayAudioWithRetry.util'

const AddRoute = (mapRef, Distance, audioRef, visitedPoints, points) => {
  const ymaps = window.ymaps

  if (!mapRef.current || !mapRef.current.mapInstance) {
    console.error("Map instance is not initialized.")
    return
  }

  const map = mapRef.current.mapInstance

  const multiRoute = new ymaps.multiRouter.MultiRoute({
    referencePoints: points.map(point => [point.latitude, point.longitude]),
    params: {
      routingMode: 'bicycle',
      results: 1
    }
  }, {
    boundsAutoApply: false
  })

  map.geoObjects.add(multiRoute)

  const updatePlacemark = (newLocation) => {
    if (mapRef.current.placemark) {
      mapRef.current.placemark.geometry.setCoordinates([newLocation.latitude, newLocation.longitude])
      map.setCenter([newLocation.latitude, newLocation.longitude])
    }

    points.forEach((point, index) => {
      const distance = GetDistanceFromLatLonInMeters(
        newLocation.latitude,
        newLocation.longitude,
        point.latitude,
        point.longitude
      )

      if (distance <= Distance && !visitedPoints.current[index]) { // Adjust the distance as needed
        visitedPoints.current[index] = true
        PlayAudioWithRetry(audioRef, point.url)
      }
    })
  }

  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      updatePlacemark({ latitude, longitude })
    },
    (error) => {
      console.error('Error watching user location:', error)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}


export { AddRoute }