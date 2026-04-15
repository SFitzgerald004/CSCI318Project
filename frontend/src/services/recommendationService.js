import api from './api'

export async function getRecommendations(tripId, category = null) {
  const params = category ? { category } : {}
  const { data } = await api.get(`/recommendations/${tripId}`, { params })
  return data
}

export async function createRecommendation(tripId, recData) {
  const { data } = await api.post(`/recommendations/${tripId}`, recData)
  return data
}

export async function deleteRecommendation(tripId, recId) {
  const { data } = await api.delete(`/recommendations/${tripId}/${recId}`)
  return data
}
