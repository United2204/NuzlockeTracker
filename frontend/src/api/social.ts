import { client } from './client';
import type { RunSummaryResponse } from '../types/api';

export interface Comment {
  id: number;
  parentId: number | null;
  runEventId: number | null;
  authorId: string;
  authorUsername: string;
  content: string;
  createdAt: string;
  replies: Comment[];
}

export interface ReactionCount {
  reactionTypeId: number;
  label: string;
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface ReactionTypeInfo {
  id: number;
  label: string;
  emoji: string;
}

export interface ReactionSummary {
  counts: ReactionCount[];
  available: ReactionTypeInfo[];
}

export interface FeedEvent {
  eventId: number;
  runId: string;
  runName: string;
  runSlug: string;
  username: string;
  eventType: string;
  payload: string;
  occurredAt: string;
}

export interface Notification {
  id: number;
  type: string;
  referenceId: number;
  read: boolean;
  createdAt: string;
}

export interface PublicProfile {
  userId: string;
  username: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
}

export const socialApi = {
  // Search
  searchUsers: (q: string) =>
    client.get<PublicProfile[]>('/api/users/search', { params: { q } }),

  // Follow
  follow: (userId: string) =>
    client.post(`/api/users/${userId}/follow`),
  unfollow: (userId: string) =>
    client.delete(`/api/users/${userId}/follow`),

  // Block
  block: (userId: string) =>
    client.post(`/api/users/${userId}/block`),
  unblock: (userId: string) =>
    client.delete(`/api/users/${userId}/block`),

  // Profile
  getPublicProfile: (username: string) =>
    client.get<PublicProfile>(`/api/users/${username}/profile`),
  getUserRuns: (username: string) =>
    client.get<RunSummaryResponse[]>(`/api/users/${username}/runs`),

  // Subscription
  isSubscribed: (runId: string) =>
    client.get<boolean>(`/api/runs/${runId}/subscription`),
  subscribe: (runId: string) =>
    client.post(`/api/runs/${runId}/subscription`),
  unsubscribe: (runId: string) =>
    client.delete(`/api/runs/${runId}/subscription`),

  // Favorite
  favorite: (runId: string) =>
    client.post(`/api/runs/${runId}/favorite`),
  unfavorite: (runId: string) =>
    client.delete(`/api/runs/${runId}/favorite`),

  // Comments
  getComments: (runId: string) =>
    client.get<Comment[]>(`/api/runs/${runId}/comments`),
  postComment: (runId: string, content: string, parentCommentId?: number) =>
    client.post<Comment>(`/api/runs/${runId}/comments`, { content, parentCommentId }),
  deleteComment: (runId: string, commentId: number) =>
    client.delete(`/api/runs/${runId}/comments/${commentId}`),

  // Reactions
  getReactions: (runId: string) =>
    client.get<ReactionSummary>(`/api/runs/${runId}/reactions`),
  toggleReaction: (runId: string, reactionTypeId: number) =>
    client.post<ReactionSummary>(`/api/runs/${runId}/reactions`, { reactionTypeId }),

  // Feed
  getPublicFeed: (page = 0) =>
    client.get<FeedEvent[]>(`/api/feed?page=${page}`),
  getFollowingFeed: (page = 0) =>
    client.get<FeedEvent[]>(`/api/feed/following?page=${page}`),

  // Notifications
  getNotifications: () =>
    client.get<Notification[]>('/api/me/notifications'),
  markSeen: () =>
    client.post('/api/me/notifications/seen'),
  markRead: (id: number) =>
    client.patch(`/api/me/notifications/${id}/read`),
  getUnreadCount: () =>
    client.get<number>('/api/me/notifications/unread-count'),
};
