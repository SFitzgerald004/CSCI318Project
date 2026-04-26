import api from './api'

export async function analyzeBudget(tripId) {
  const { data } = await api.post(`/ai/${tripId}/analyze`)
  return data
}

export async function getAiRecommendations(tripId, focus = 'overall') {
  const { data } = await api.post(`/ai/${tripId}/recommend`, { focus })
  return data
}

export async function chatWithAi(tripId, message, history = []) {
  const { data } = await api.post(`/ai/${tripId}/chat`, {
    message,
    history
  })
  return data
}

export async function generateItinerary(tripId) {
  const { data } = await api.post(`/ai/${tripId}/generate-itinerary`)
  return data
}

export async function getFlightRecommendations(tripId, origin, destination) {
  const { data } = await api.get(`/ai/${tripId}/flights`, {
    params: { origin, destination }
  })
  return data
}