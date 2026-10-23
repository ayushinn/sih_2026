import { apiClient } from '../client';
import { DocumentMeta } from '../types';

export const documentQueries = {
  getDocuments: (applicationId: string) =>
    apiClient.get<DocumentMeta[]>(`/applications/${applicationId}/documents`),
  uploadDocument: (applicationId: string, formData: FormData) =>
    apiClient.upload<DocumentMeta>(`/applications/${applicationId}/documents`, formData),
  getDocument: (id: string) => apiClient.get<DocumentMeta>(`/documents/${id}`),
  getDocumentFile: (id: string) => apiClient.get<Blob>(`/documents/${id}/file`),
};
