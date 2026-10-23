import { apiClient } from '../client';
import { Application, Page } from '../types';

export const applicationQueries = {
  getApplications: () => apiClient.get<Page<Application>>('/applications'),
  getApplication: (id: string) => apiClient.get<Application>(`/applications/${id}`),
  createApplication: (payload: { category: string }) =>
    apiClient.post<Application>('/applications', payload),
  patchApplication: (id: string, payload: Partial<Application>) =>
    apiClient.patch<Application>(`/applications/${id}`, payload),
  submitApplication: (id: string) =>
    apiClient.post<Application>(`/applications/${id}/submit`),
};
