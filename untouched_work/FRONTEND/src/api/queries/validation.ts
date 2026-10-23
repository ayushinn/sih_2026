import { apiClient } from '../client';
import { Job } from '../types';

export const validationQueries = {
  runValidation: (applicationId: string) =>
    apiClient.post<{ job_id: string; status: string }>(`/applications/${applicationId}/validate`),
  getJob: (jobId: string) => apiClient.get<Job>(`/jobs/${jobId}`),
};
