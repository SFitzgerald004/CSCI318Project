import api from './api'

export async function getTrips() {
  const { data } = await api.get('/trips')
  return data
}

export async function getTrip(tripId) {
  const { data } = await api.get(`/trips/${tripId}`)
  return data
}

export async function createTrip(tripData) {
  const { data } = await api.post('/trips', tripData)
  return data
}
