import { apiClient } from '../client';

export interface ReportSummary {
  application_id: string;
  institution_id: string;
  status: string;
  findings_count: number;
  generated_at: string;
  advisory_disclaimer: string;
}

export const reportQueries = {
  getReport: (applicationId: string) =>
    apiClient.get<ReportSummary>(`/applications/${applicationId}/report`),
  getReportPdf: (applicationId: string) =>
    apiClient.get<Blob>(`/applications/${applicationId}/report.pdf`),
};
