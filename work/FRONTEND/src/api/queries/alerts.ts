import { apiClient } from '../client';
import { Alert, Page } from '../types';

export const alertQueries = {
  getAlerts: () => apiClient.get<Page<Alert>>('/alerts'),
  ackAlert: (id: string) => apiClient.post<Alert>(`/alerts/${id}/ack`),
};
