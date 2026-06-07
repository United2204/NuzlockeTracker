import { client } from './client';

export interface SettingsResponse {
  allowFollowers: boolean;
  language: string | null;
}

export const settingsApi = {
  get: () =>
    client.get<SettingsResponse>('/api/me/settings'),
  update: (data: Partial<{ allowFollowers: boolean; language: string | null }>) =>
    client.patch<SettingsResponse>('/api/me/settings', data),
};
