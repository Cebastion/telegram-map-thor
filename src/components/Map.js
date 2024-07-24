import React, { useEffect, useRef, useState } from 'react'
import { speak } from '../utils/speechSynthesis'

const Map = () => {
  const mapRef = useRef(null)
  const mapInstance = useRef(null) // Ссылка на экземпляр карты
  const watchId = useRef(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [multiRoute, setMultiRoute] = useState(null)

  useEffect(() => {
    const initMap = () => {
      const ymaps = window.ymaps // Получаем ymaps из глобального объекта

      ymaps.ready(() => {
        // Удаление предыдущего экземпляра карты
        if (mapInstance.current) {
          mapInstance.current.destroy()
        }

        // Создание нового экземпляра карты
        mapInstance.current = new ymaps.Map(mapRef.current, {
          center: [55.751574, 37.573856],
          zoom: 9,
        })

        // Запуск геолокации
        if ('geolocation' in navigator) {
          watchId.current = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              setCurrentLocation([latitude, longitude])
            },
            (error) => console.error(error),
            {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 5000,
            }
          )
        }
      })
    }

    initMap()

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current)
      }
      if (mapInstance.current) {
        mapInstance.current.destroy() // Очистка карты при размонтировании компонента
      }
    }
  }, [])

  useEffect(() => {
    const ymaps = window.ymaps // Получаем ymaps из глобального объекта

    if (currentLocation && mapInstance.current) {
      // Удаление предыдущего маршрута
      if (multiRoute) {
        mapInstance.current.geoObjects.remove(multiRoute)
      }

      const newRoute = new ymaps.multiRouter.MultiRoute({
        referencePoints: [
          currentLocation, // Текущие координаты пользователя
          [55.76492700000001, 37.615519], // Точка 1
          [55.757914, 37.615519], // Точка 2
          [55.763338, 37.629351], // Точка 3
          [55.770703, 37.621035]   // Координаты конечной точки
        ],
        params: {
          routingMode: 'pedestrian', // Указываем маршрут для пешеходов
          results: 1
        }
      }, {
        boundsAutoApply: true
      })

      mapInstance.current.geoObjects.add(newRoute)
      setMultiRoute(newRoute)

      newRoute.model.events.add('requestsuccess', () => {
        const activeRoute = newRoute.getActiveRoute()
        if (activeRoute) {
          let segments = []
          activeRoute.getPaths().each((path) => {
            path.getSegments().each((segment) => {
              const action = segment.properties.get('action')
              const instruction = segment.properties.get('text')
              const coordinates = segment.geometry.getCoordinates()

              if (typeof action === 'string' && action.startsWith('turn')) {
                segments.push({ action, instruction, coordinates })
              }
            })
          })

          navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              segments.forEach((segment, index) => {
                const [segmentLat, segmentLon] = segment.coordinates[0]
                const distance = getDistance(
                  { lat: latitude, lon: longitude },
                  { lat: segmentLat, lon: segmentLon }
                )
                if (distance < 50) { // 50 метров до поворота
                  speak(segment.instruction)
                  segments.splice(index, 1) // Удаляем озвученный сегмент
                }
              })
            },
            (error) => console.error(error),
            {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 5000,
            }
          )
        }
      })
    }
  }, [currentLocation])

  const getDistance = (point1, point2) => {
    const rad = (x) => (x * Math.PI) / 180
    const R = 6378137 // Радиус Земли в метрах
    const dLat = rad(point2.lat - point1.lat)
    const dLong = rad(point2.lon - point1.lon)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(point1.lat)) * Math.cos(rad(point2.lat)) *
      Math.sin(dLong / 2) * Math.sin(dLong / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return distance
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
}

export default Map