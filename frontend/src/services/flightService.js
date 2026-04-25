import api from './api'

export async function getFlights(tripId, origin = 'JFK', passengers = 1) {
    const { data } = await api.get(`/flights/${tripId}`, {
        params: { origin, passengers }
    })
    return data
}