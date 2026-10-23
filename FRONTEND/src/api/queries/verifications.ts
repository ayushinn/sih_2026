import { apiClient } from '../client';
import { Verification } from '../types';

export const verificationQueries = {
  getVerifications: () => apiClient.get<Verification[]>('/verifications'),
  verifyDocument: (documentId: string) =>
    apiClient.post<Verification>(`/documents/${documentId}/verify`),
  getVerification: (id: string) => apiClient.get<Verification>(`/verifications/${id}`),
  manualConfirm: (verificationId: string, payload: { notes: string }) =>
    apiClient.post<Verification>(`/verifications/${verificationId}/manual-confirm`, payload),
};
