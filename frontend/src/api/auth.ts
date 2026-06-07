import { client } from './client';
import type { TokenResponse, MeResponse } from '../types/api';

export const authApi = {
  register: (email: string, username: string, password: string) =>
    client.post('/api/auth/register', { email, username, password }),

  login: (email: string, password: string) =>
    client.post<TokenResponse>('/api/auth/login', { email, password }),

  me: () =>
    client.get<MeResponse>('/api/auth/me'),

  logout: () =>
    client.post('/api/auth/logout'),

  verifyEmail: (verifyToken: string) =>
    client.get(`/api/auth/verify-email?token=${verifyToken}`),

  forgotPassword: (email: string) =>
    client.post('/api/auth/forgot-password', { email }),

  resetPassword: (resetToken: string, newPassword: string) =>
    client.post('/api/auth/reset-password', { token: resetToken, newPassword }),
};
