import api from './api';

export async function analyzeBudget(tripId, { force = false } = {}) {
  const { data } = await api.post(`/ai/${tripId}/analyze`, { force });
  return data;
}

export async function getAiRecommendations(tripId, focus = 'overall', { force = false } = {}) {
  const { data } = await api.post(`/ai/${tripId}/recommend`, { focus, force });
  return data;
}

export async function getAiMessages(tripId) {
  const { data } = await api.get(`/ai/${tripId}/messages`);
  return data;
}

// New helpers from backend integration

export async function chatWithAi(tripId, message, history = []) {
  const { data } = await api.post(`/ai/${tripId}/chat`, { message, history });
  return data;
}

export async function generateItinerary(tripId) {
  const { data } = await api.post(`/ai/${tripId}/generate-itinerary`);
  return data;
}

export async function getFlightRecommendations(tripId, origin, destination) {
  const { data } = await api.get(`/ai/${tripId}/flights`, {
    params: { origin, destination },
  });
  return data;
}

export async function getActivityRecommendations(tripId) {
  const { data } = await api.post(`/ai/${tripId}/activities`);
  return data;
}
