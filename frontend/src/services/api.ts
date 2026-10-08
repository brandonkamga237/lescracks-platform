import { http } from '@/services/http';
import type { Query } from '@/services/http';
import type {
  AuthProvider, Category, ChallengeDetail, ChallengeDifficulty, ChallengeSubmission, ChallengeSummary, CrackLabProgress, CrackLabPublicResult, RankingEntry, RankingPeriod, EventFormat, EventSummary, EventType, PageResponse, ResourceKind,
  NewsletterStatus, ResourceLikeStatus, ResourceSummary, Tag, TalkVideo, UserIdentity, UserProfile,
  UserProfileUpdate,
} from '@/services/types';

export interface CatalogueFilters extends Query {
  kind?: ResourceKind;
  categoryId?: number;
  search?: string;
  tagId?: number;
  page?: number;
  size?: number;
}

export interface CrackLabFilters extends Query {
  difficulty?: ChallengeDifficulty;
  category?: string;
  tag?: string;
  page?: number;
  size?: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const api = {
  login: (email: string, password: string) => http.post('/auth/login', { email, password }),
  register: (body: RegisterRequest) => http.post('/auth/register', body),
  forgotPassword: (email: string) => http.post<void>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => http.post<void>('/auth/reset-password', { token, password }),
  logout: () => http.post<void>('/auth/logout'),
  resources: (filters: CatalogueFilters = {}, signal?: AbortSignal) =>
    http.get<PageResponse<ResourceSummary>>('/resources', filters, signal),
  resource: (slugOrId: string | number, signal?: AbortSignal) =>
    http.get<ResourceSummary>(`/resources/${slugOrId}`, undefined, signal),
  events: (filters: { type?: EventType; format?: EventFormat; page?: number; size?: number } = {}, signal?: AbortSignal) =>
    http.get<PageResponse<EventSummary>>('/events', filters, signal),
  upcomingEvents: (page = 0, size = 12, signal?: AbortSignal) =>
    http.get<PageResponse<EventSummary>>('/events/upcoming', { page, size }, signal),
  pastEvents: (page = 0, size = 12, signal?: AbortSignal) =>
    http.get<PageResponse<EventSummary>>('/events/past', { page, size }, signal),
  event: (slugOrId: string | number, signal?: AbortSignal) =>
    http.get<EventSummary>(`/events/${slugOrId}`, undefined, signal),
  talks: (page = 0, size = 12, signal?: AbortSignal) =>
    http.get<PageResponse<TalkVideo>>('/talks', { page, size }, signal),
  categories: (signal?: AbortSignal) => http.get<Category[]>('/categories', undefined, signal),
  tags: (categoryId?: number, signal?: AbortSignal) => http.get<Tag[]>('/tags', { categoryId }, signal),
  me: (signal?: AbortSignal) => http.get<UserProfile>('/me', undefined, signal),
  syncOidc: (provider: 'google' | 'github') =>
    http.post<UserProfile>('/oidc/sync', { provider: provider.toUpperCase() }),
  identities: (signal?: AbortSignal) => http.get<UserIdentity[]>('/me/identities', undefined, signal),
  linkIdentity: (provider: AuthProvider, token: string) =>
    http.post<UserIdentity>('/me/identities', { provider, token }),
  unlinkIdentity: (provider: AuthProvider) => http.delete<void>(`/me/identities/${provider}`),
  updateProfile: (body: UserProfileUpdate) => http.patch<UserProfile>('/me', body),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.postForm<UserProfile>('/me/avatar', form);
  },
  changePassword: (body: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    http.post<void>('/me/password', body),
  newsletterStatus: (signal?: AbortSignal) => http.get<NewsletterStatus>('/newsletter', undefined, signal),
  newsletterSubscribe: () => http.post<NewsletterStatus>('/newsletter/subscribe'),
  newsletterPublicSubscribe: (body: { email: string }) => http.post<NewsletterStatus>('/newsletter/public/subscribe', body),
  newsletterUnsubscribe: () => http.delete<NewsletterStatus>('/newsletter/unsubscribe'),
  verifyEmail: (token: string) => http.post<void>('/auth/verify-email', undefined, { token }),
  resendVerification: (email: string) => http.post<void>('/auth/resend-verification', { email }),
  resourceLikes: (id: number, signal?: AbortSignal) => http.get<ResourceLikeStatus>(`/resources/${id}/likes`, undefined, signal),
  likeResource: (id: number) => http.post<ResourceLikeStatus>(`/resources/${id}/likes`),
  unlikeResource: (id: number) => http.delete<ResourceLikeStatus>(`/resources/${id}/likes`),
  cracklab: {
    challenges: (filters: CrackLabFilters = {}, signal?: AbortSignal) =>
      http.get<PageResponse<ChallengeSummary>>('/cracklab/challenges', filters, signal),
    challenge: (slug: string, signal?: AbortSignal) => http.get<ChallengeDetail>(`/cracklab/challenges/${encodeURIComponent(slug)}`, undefined, signal),
    submit: (slug: string, answer: string) => http.post<ChallengeSubmission>(`/cracklab/challenges/${encodeURIComponent(slug)}/submissions`, { answer }),
    answers: (slug: string, signal?: AbortSignal) => http.get<ChallengeSubmission[]>(`/cracklab/challenges/${encodeURIComponent(slug)}/submissions`, undefined, signal),
    mine: (signal?: AbortSignal) => http.get<ChallengeSubmission[]>('/cracklab/submissions/mine', undefined, signal),
    vote: (submissionId: number, value: -1 | 0 | 1) => http.put<{ voteScore: number; myVote: -1 | 0 | 1 }>(`/cracklab/submissions/${submissionId}/vote`, { value }),
    ranking: (period: RankingPeriod = 'all', page = 0, size = 20, signal?: AbortSignal) =>
      http.get<PageResponse<RankingEntry>>('/cracklab/ranking', { period, page, size }, signal),
    progress: (signal?: AbortSignal) => http.get<CrackLabProgress>('/cracklab/me/progress', undefined, signal),
    member: (id: number, signal?: AbortSignal) => http.get<CrackLabProgress>(`/cracklab/members/${id}`, undefined, signal),
    result: (id: number, signal?: AbortSignal) => http.get<CrackLabPublicResult>(`/cracklab/results/${id}`, undefined, signal),
  },
};

export default api;