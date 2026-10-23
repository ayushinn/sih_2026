import { apiClient } from '../client';
import { Application, DecisionType, Page } from '../types';

export interface DecisionPayload {
  decision: DecisionType;
  decision_note: string;
}

export const officerQueries = {
  getQueue: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient.get<Page<Application>>('/officer/queue', { params }),
  recordDecision: (applicationId: string, payload: DecisionPayload) =>
    apiClient.post<{ application_id: string; status: string; decision: string }>(
      `/applications/${applicationId}/decision`,
      payload
    ),
};
