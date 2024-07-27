const GetDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000 // Радиус Земли в метрах
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon1 - lon2) * Math.PI) / 180
  const a =
    0.5 - Math.cos(dLat) / 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * (1 - Math.cos(dLon)) / 2

  return R * 2 * Math.asin(Math.sqrt(a))
}


export { GetDistanceFromLatLonInMeters }