import { apiClient } from '../client';
import { Finding } from '../types';

export const findingQueries = {
  getFindings: (applicationId: string) =>
    apiClient.get<Finding[]>(`/applications/${applicationId}/findings`),
  getFinding: (findingId: string) =>
    apiClient.get<Finding>(`/findings/${findingId}`),
  reviewFinding: (findingId: string, payload: { action: 'accept' | 'dismiss'; review_note: string }) =>
    apiClient.post<Finding>(`/findings/${findingId}/review`, payload),
};
