import api from './api'

export async function getFlights(tripId, origin, destination) {
    const { data } = await api.get(`/flights/${tripId}`, {
        params: { origin, destination }
    })
    return data
}