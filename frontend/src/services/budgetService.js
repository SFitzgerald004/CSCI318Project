import api from './api'

export async function getAllocation(tripId) {
  const { data } = await api.get(`/budget/${tripId}/allocate`)
  return data
}

export async function createAllocation(tripId, regenerate = false) {
  const { data } = await api.post(`/budget/${tripId}/allocate`, { regenerate })
  return data
}

export async function getSavings(tripId) {
  const { data } = await api.get(`/budget/${tripId}/savings`)
  return data
}

export async function createSavings(tripId, amountSaved) {
  const { data } = await api.post(`/budget/${tripId}/savings`, { amount_saved: amountSaved })
  return data
}
