import { client } from './client';

export interface Contribution {
  id: number;
  contributorUsername: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  gameId: number;
  gameName: string;
  dataType: 'ROUTE' | 'ENCOUNTER_TABLE' | 'POKEMON';
  dataJson: Record<string, unknown>;
  adminFeedback: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export const contributionsApi = {
  submit: (gameId: number, dataType: string, dataJson: Record<string, unknown>) =>
    client.post<Contribution>('/api/contributions', { gameId, dataType, dataJson }),

  listMine: () =>
    client.get<Contribution[]>('/api/me/contributions'),

  resubmit: (id: number, gameId: number, dataType: string, dataJson: Record<string, unknown>) =>
    client.post<Contribution>(`/api/contributions/${id}/resubmit`, { gameId, dataType, dataJson }),

  listPending: () =>
    client.get<Contribution[]>('/api/admin/contributions/pending'),

  review: (id: number, action: string, adminFeedback?: string) =>
    client.post<Contribution>(`/api/admin/contributions/${id}/review`, { action, adminFeedback }),
};
