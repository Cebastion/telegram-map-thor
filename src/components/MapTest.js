import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getData } from '../API/api.service'
import './Modal.css'
import { GetUserLocationTest } from '../utils/GetUserLocationTest.until'
import { InitMapTest } from '../utils/InitMapTest.until'
import { PlayAudioWithRetry } from '../utils/PlayAudioWithRetry.util'
import { AddRouteTest } from '../utils/AddRouteTest.util'
import { GetDistanceFromLatLonInMeters } from '../utils/GetDistanceFromLatLonInMeters.util'

const Distance = 20 // ТУТ МЕНЯЕМ РАССТОЯНИЕ
const timeout = 4000 // ТУТ ТАЙМЕР ЧЕРЕЗ СКОЛЬКО ПОВТОРИТЬ ПОПЫТКУ ВОСПРОИЗВЕСТИ ЗВУК

const Map = () => {
  const [userLocation, setUserLocation] = useState(null)
  const [points, setPoints] = useState([])
  const [showModal, setShowModal] = useState(true)
  const [routeAdded, setRouteAdded] = useState(false)
  const mapRef = useRef(null)
  const mapInitialized = useRef(false)
  const audioRef = useRef(null)
  const visitedPoints = useRef([])
  const { NameThor } = useParams()

  useEffect(() => {
    getData(NameThor).then((data) => {
      setPoints(data)
      visitedPoints.current = Array(data.length).fill(false)
    })
  }, [showModal])

  const handleStartRoute = () => {
    setShowModal(false)
    GetUserLocationTest(setUserLocation)

    audioRef.current.play().catch(error => {
      console.error('Initial audio play failed:', error)
    })
  }

  useEffect(() => {
    if (userLocation && !mapInitialized.current) {
      InitMapTest(mapInitialized, mapRef, userLocation)
    }
  }, [userLocation])

  useEffect(() => {
    if (showModal) return

    if (mapInitialized.current && userLocation && points.length > 0 && !routeAdded) {
      points.forEach((point, index) => {
        const distance = GetDistanceFromLatLonInMeters(
          userLocation.latitude,
          userLocation.longitude,
          point.latitude,
          point.longitude
        )

        if (distance <= Distance && !visitedPoints.current[index]) {
          visitedPoints.current[index] = true
          //alert(`Точка ${index + 1} посещена!`);
          PlayAudioWithRetry(audioRef, point.url, timeout)
        }
      })

      AddRouteTest(mapRef, Distance, audioRef, visitedPoints, points)
      setRouteAdded(true)
    }
  }, [showModal, userLocation, points, mapInitialized.current, routeAdded])

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
      <audio ref={audioRef} preload="auto" />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Test Тур: {NameThor ? NameThor : '1'}</h2>
            <button onClick={handleStartRoute}>Начать маршрут</button>
          </div>
        </div>
      )}
    </>
  )
}

export default Map
