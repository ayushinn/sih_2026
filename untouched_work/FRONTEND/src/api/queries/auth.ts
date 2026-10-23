import { apiClient } from '../client';
import { User } from '../types';

export interface LoginPayload {
  email: string;
  password?: string;
}

export const authQueries = {
  login: (payload: LoginPayload) => apiClient.post<{ message: string; user: User }>('/auth/login', payload),
  logout: () => apiClient.post<{ message: string }>('/auth/logout'),
  refresh: () => apiClient.post<{ status: string }>('/auth/refresh'),
  getMe: () => apiClient.get<User>('/auth/me'),
};
