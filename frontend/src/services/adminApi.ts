import { ENV } from '@/config/env';
import { prepareImage } from '@/lib/image';
import { http } from '@/services/http';
import type { Query } from '@/services/http';
import type { AdminArticle, AdminBadge, AdminComment, AdminCertificate, BadgeHolder, AdminProject, AdminRegistration, ProjectStatus, AdminSubscriber, AdminSummary, AdminUser, ArticleBlock, AudienceStats, AuthProvider, Category, ContentViews, MemberPortrait, EventFormat, EventStatus, EventSummary, EventType, NewsletterCampaign, NewsletterStats, PageResponse, ResourceStatus, Tag, TalkStatus, TalkVideo, TopResource, SubscriberFlowPoint, UserGrowthPoint, WatchSignal, BulkAwardResult, MemberActivity, Conversions } from '@/services/types';

export interface ArticleRequest {
  title: string;
  description: string;
  coverImage: string;
  categoryId: number;
  tagIds?: number[];
  status?: ResourceStatus;
  /** A date keeps it a draft until then; null or absent cancels any schedule. */
  scheduledAt?: string | null;
  body: unknown;
}
export interface EventRequest {
  title: string;
  description: string;
  type: EventType;
  format: EventFormat;
  startDate: string;
  endDate?: string;
  location?: string;
  status?: EventStatus;
  scheduledAt?: string | null;
  acceptsSubmissions?: boolean;
  maxTeamSize?: number;
  submissionDeadline?: string | null;
}
export interface TalkRequest {
  title: string;
  /** An image uploaded through uploadImage; empty keeps the YouTube thumbnail. */
  coverImage?: string;
  description: string;
  guest?: string;
  youtubeUrl: string;
  durationMinutes?: number;
  publishedAt?: string;
  status?: TalkStatus;
}
export interface AdminArticleFilters extends Query {
  page?: number;
  size?: number;
  search?: string;
  status?: ResourceStatus;
}

export interface UserFilters {
  verified?: boolean;
}

export interface StatsOverview {
  users: number;
  usersByStatus: Partial<Record<'ACTIVE' | 'INACTIVE' | 'BANNED', number>>;
  usersByProvider: Partial<Record<AuthProvider, number>>;
  verifiedUsers: number;
  usersNewLast30d: number;
  usersActiveLast7d: number;
  usersActiveLast30d: number;
  /** Addresses known only from the public newsletter form; not counted in `users`. */
  newsletterContacts: number;
  /** What became of the last 30 days of sign-ups. */
  signupFunnel: { signedUp: number; verified: number; onboarded: number; returned: number };
  events: number;
  eventsByStatus: Partial<Record<EventStatus, number>>;
  eventsByType: Partial<Record<EventType, number>>;
  eventsUpcoming: number;
  eventsOngoing: number;
  eventsPast: number;
  resources: number;
  resourcesByStatus: Partial<Record<ResourceStatus, number>>;
  resourcesByCategory: Record<string, number>;
  newsletterSubscribers: number;
  newsletterUnsubscribed: number;
  newsletterNewLast30d: number;
  talks: number;
  talksPublished: number;
}

/** Covers are shrunk before upload so shared links point to a light, preview-friendly image. */
const cover = (file?: File) => (file ? prepareImage(file, { jpeg: true }) : Promise.resolve(undefined));

function dataBlob(data: ArticleRequest) {
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}

function eventForm(data: EventRequest, coverImageFile?: File) {
  const form = new FormData();
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  if (coverImageFile) form.append('coverImageFile', coverImageFile);
  return form;
}

function articleForm(data: ArticleRequest, coverImageFile?: File) {
  const form = new FormData();
  form.append('data', dataBlob(data));
  if (coverImageFile) form.append('coverImageFile', coverImageFile);
  return form;
}

async function downloadCsv(path: string, filename: string) {
  const response = await fetch(`${ENV.API_BASE_URL}${path}`, { credentials: 'include' });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Le téléchargement a échoué.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const adminApi = {
  login: (username: string, password: string) => http.post('/admin/auth/login', { username, password }),
  me: () => http.get<{ username: string; role: string }>('/admin/auth/me'),
  logout: () => http.post<void>('/admin/auth/logout'),
  overview: (signal?: AbortSignal) => http.get<StatsOverview>('/admin/stats/overview', undefined, signal),
  createArticle: async (data: ArticleRequest, coverImageFile: File) => http.postForm<AdminArticle>('/resources/admin/articles', articleForm(data, await cover(coverImageFile))),
  updateArticle: async (id: number, data: ArticleRequest, coverImageFile?: File) => http.putForm<AdminArticle>(`/resources/admin/articles/${id}`, articleForm(data, await cover(coverImageFile))),
  articles: (filters: AdminArticleFilters = {}, signal?: AbortSignal) =>
    http.get<PageResponse<AdminArticle>>('/resources/admin', { size: 12, sort: 'createdAt,desc', ...filters, kind: 'ARTICLE' }, signal),
  deleteArticle: (id: number) => http.delete<void>(`/resources/admin/${id}`),
  events: (page = 0, signal?: AbortSignal) => http.get<PageResponse<EventSummary>>('/events/admin', { page, size: 12, sort: 'startDate,desc' }, signal),
  createEvent: async (body: EventRequest, coverImageFile: File) => http.postForm<EventSummary>('/events/admin', eventForm(body, await cover(coverImageFile))),
  updateEvent: async (id: number, body: EventRequest, coverImageFile?: File) => http.putForm<EventSummary>(`/events/admin/${id}`, eventForm(body, await cover(coverImageFile))),
  deleteEvent: (id: number) => http.delete<void>(`/events/admin/${id}`),
  talks: (page = 0, signal?: AbortSignal) => http.get<PageResponse<TalkVideo>>('/talks/admin', { page, size: 12, sort: 'createdAt,desc' }, signal),
  createTalk: (body: TalkRequest) => http.post<TalkVideo>('/talks/admin', body),
  updateTalk: (id: number, body: TalkRequest) => http.put<TalkVideo>(`/talks/admin/${id}`, body),
  deleteTalk: (id: number) => http.delete<void>(`/talks/admin/${id}`),
  createCategory: (name: string) => http.post<Category>('/admin/categories', { name }),
  renameCategory: (id: number, name: string) => http.put<Category>(`/admin/categories/${id}`, { name }),
  deleteCategory: (id: number) => http.delete<void>(`/admin/categories/${id}`),
  createTag: (name: string) => http.post<Tag>('/admin/tags', { name }),
  renameTag: (id: number, name: string) => http.put<Tag>(`/admin/tags/${id}`, { name }),
  deleteTag: (id: number) => http.delete<void>(`/admin/tags/${id}`),
  users: (page = 0, search = '', filters: UserFilters = {}, signal?: AbortSignal) =>
    http.get<PageResponse<AdminUser>>('/admin/users', { page, size: 12, search, ...filters, sort: 'createdAt,desc' }, signal),
  resendUserVerification: (id: number) => http.post<void>(`/admin/users/${id}/verification-email`),
  verifyUser: (id: number) => http.post<AdminUser>(`/admin/users/${id}/verify`),
  user: (id: number, signal?: AbortSignal) => http.get<AdminUser>(`/admin/users/${id}`, undefined, signal),
  userActivity: (id: number, signal?: AbortSignal) => http.get<MemberActivity>(`/admin/users/${id}/activity`, undefined, signal),
  updateUserStatus: (id: number, status: AdminUser['status']) =>
    http.patch<AdminUser>(`/admin/users/${id}/status`, { status }),
  deleteUser: (id: number) => http.delete<void>(`/admin/users/${id}`),
  uploadImage: async (image: File) => {
    const form = new FormData();
    form.append('image', await prepareImage(image));
    return http.postForm<{ url: string }>('/admin/upload/image', form);
  },
  newsletterStats: (signal?: AbortSignal) => http.get<NewsletterStats>('/newsletter/admin/stats', undefined, signal),
  newsletterSubscriptions: (status: string | '', signal?: AbortSignal) =>
    http.get<AdminSubscriber[]>('/newsletter/admin/subscriptions', status ? { status } : undefined, signal),
  newsletterBroadcast: (subject: string, body: ArticleBlock[]) =>
    http.post<number>('/newsletter/admin/broadcast', { subject, body }),
  newsletterTest: (subject: string, body: ArticleBlock[], email: string) =>
    http.post<void>('/newsletter/admin/test', { subject, body, email }),
  newsletterPreview: (subject: string, body: ArticleBlock[]) =>
    http.post<{ html: string }>('/newsletter/admin/preview', { subject, body }),
  newsletterUnsubscribe: (subscriberId: number) => http.post<AdminSubscriber>(`/newsletter/admin/subscriptions/${subscriberId}/unsubscribe`),
  newsletterSubscribe: (subscriberId: number) => http.post<AdminSubscriber>(`/newsletter/admin/subscriptions/${subscriberId}/subscribe`),
  newsletterCampaigns: (signal?: AbortSignal) => http.get<NewsletterCampaign[]>('/newsletter/admin/campaigns', undefined, signal),
  exportUsers: () => downloadCsv('/admin/users/export', 'lescracks-users.csv'),
  exportNewsletter: () => downloadCsv('/newsletter/admin/subscriptions/export', 'lescracks-newsletter.csv'),
  userGrowth: (from: string, to: string, signal?: AbortSignal) =>
    http.get<{ from: string; to: string; points: UserGrowthPoint[] }>('/admin/stats/user-growth', { from, to }, signal),
  newsletterGrowth: (from: string, to: string, signal?: AbortSignal) =>
    http.get<{ from: string; to: string; points: SubscriberFlowPoint[] }>('/admin/stats/newsletter-growth', { from, to }, signal),
  conversions: (days = 30, signal?: AbortSignal) => http.get<Conversions>('/admin/stats/conversions', { days }, signal),
  audience: (days = 30, signal?: AbortSignal) =>
    http.get<AudienceStats>('/admin/stats/audience', { days }, signal),
  eventRegistrations: (id: number, signal?: AbortSignal) => http.get<AdminRegistration[]>(`/events/admin/${id}/registrations`, undefined, signal),
  writeToRegistrants: (id: number, message: string) =>
    http.post<{ sent: number }>(`/events/admin/${id}/registrants/messages`, { message }),
  markAttendance: (registrationId: number, status: 'ATTENDED' | 'ABSENT' | 'REGISTERED') =>
    http.patch<unknown>(`/events/admin/registrations/${registrationId}`, { status }),
  eventProjects: (id: number, signal?: AbortSignal) => http.get<AdminProject[]>(`/events/admin/${id}/submissions`, undefined, signal),
  reviewProject: (id: number, review: { status?: ProjectStatus; score?: number | null; rank?: number | null; note?: string }) =>
    http.patch<AdminProject>(`/events/admin/submissions/${id}`, review),
  comments: (reported: boolean, page = 0, signal?: AbortSignal) =>
    http.get<PageResponse<AdminComment>>('/comments/admin', { reported, page, size: 20 }, signal),
  moderateComment: (id: number, status: 'VISIBLE' | 'HIDDEN') => http.put<AdminComment>(`/comments/admin/${id}`, { status }),
  eraseComment: (id: number) => http.delete<void>(`/comments/admin/${id}`),
  badges: (signal?: AbortSignal) => http.get<AdminBadge[]>('/badges/admin', undefined, signal),
  createBadge: (badge: { name: string; description: string; icon: string }) => http.post<AdminBadge>('/badges/admin', badge),
  updateBadge: (id: number, badge: { name: string; description: string; icon: string }) => http.put<AdminBadge>(`/badges/admin/${id}`, badge),
  deleteBadge: (id: number) => http.delete<void>(`/badges/admin/${id}`),
  badgeHolders: (id: number, signal?: AbortSignal) => http.get<BadgeHolder[]>(`/badges/admin/${id}/holders`, undefined, signal),
  awardBadge: (id: number, email: string, reason?: string) => http.post<void>(`/badges/admin/${id}/holders`, { email, reason }),
  awardBadgeToMany: (id: number, grant: { emails: string[]; eventId?: number; presentOnly: boolean; reason?: string }) =>
    http.post<BulkAwardResult>(`/badges/admin/${id}/holders/bulk`, grant),
  revokeBadge: (id: number, userId: number) => http.delete<void>(`/badges/admin/${id}/holders/${userId}`),
  eventCertificates: (eventId: number, signal?: AbortSignal) => http.get<AdminCertificate[]>(`/certificates/admin/events/${eventId}`, undefined, signal),
  prepareCertificates: (eventId: number) => http.post<AdminCertificate[]>(`/certificates/admin/events/${eventId}/drafts`),
  issueCertificates: (ids: number[]) => http.post<void>('/certificates/admin/issue', { ids }),
  revokeCertificate: (id: number) => http.post<void>(`/certificates/admin/${id}/revoke`),
  discardCertificate: (id: number) => http.delete<void>(`/certificates/admin/${id}`),
  memberPortrait: (signal?: AbortSignal) => http.get<MemberPortrait>('/admin/stats/members', undefined, signal),
  contentViews: (days = 30, signal?: AbortSignal) =>
    http.get<ContentViews>('/admin/stats/content-views', { days }, signal),
  watch: (signal?: AbortSignal) =>
    http.get<{ signals: WatchSignal[] }>('/admin/stats/watch', undefined, signal),
  newsletterSubscribers: (signal?: AbortSignal) => http.get<AdminSubscriber[]>('/newsletter/admin/subscribers', undefined, signal),
  topResources: (limit = 5, signal?: AbortSignal) =>
    http.get<{ limit: number; resources: TopResource[] }>('/admin/stats/top-resources', { limit }, signal),
  admins: (signal?: AbortSignal) => http.get<AdminSummary[]>('/admin/admins', undefined, signal),
  createAdmin: (username: string, password: string) => http.post<AdminSummary>('/admin/admins', { username, password }),
  deleteAdmin: (id: number) => http.delete<void>(`/admin/admins/${id}`),
};

export default adminApi;
