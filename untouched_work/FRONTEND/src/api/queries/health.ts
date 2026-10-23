import { apiClient } from '../client';

export const healthQueries = {
  getHealthz: () => apiClient.get<{ status: string }>('/healthz'),
  getReadyz: () => apiClient.get<{ status: string }>('/readyz'),
};
