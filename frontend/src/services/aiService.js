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
