const GetUserLocation = (setUserLocation) => {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude })
      },
      (error) => {
        console.error('Error getting user location:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  } else {
    console.error('Geolocation is not supported by this browser.')
  }
}

export { GetUserLocation }