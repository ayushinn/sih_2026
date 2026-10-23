import { apiClient } from '../client';
import { Checklist, Role, User } from '../types';

export const adminQueries = {
  getChecklists: () => apiClient.get<Checklist[]>('/admin/checklists'),
  createChecklist: (payload: Partial<Checklist>) =>
    apiClient.post<Checklist>('/admin/checklists', payload),
  updateChecklist: (id: string, payload: Partial<Checklist>) =>
    apiClient.put<Checklist>(`/admin/checklists/${id}`, payload),
  getUsers: () => apiClient.get<User[]>('/admin/users'),
  updateUserRole: (userId: string, role: Role) =>
    apiClient.patch<User>(`/admin/users/${userId}/role`, { role }),
};
