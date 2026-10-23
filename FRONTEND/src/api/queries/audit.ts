import { apiClient } from '../client';
import { AuditEntry, Page } from '../types';

export const auditQueries = {
  getAuditLogs: () => apiClient.get<Page<AuditEntry>>('/audit'),
};
