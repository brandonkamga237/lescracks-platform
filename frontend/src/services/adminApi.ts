import { ENV } from '@/config/env';
import { http } from '@/services/http';
import type { Query } from '@/services/http';
import type { AdminSubscriber, AdminSummary, AdminUser, AuthProvider, Category, EventFormat, EventStatus, EventSummary, EventType, NewsletterCampaign, NewsletterStats, PageResponse, ResourceKind, ResourceStatus, ResourceSummary, Tag, TopResource, UserGrowthPoint } from '@/services/types';

export interface EbookRequest {
  title: string;
  description: string;
  coverImage: string;
  categoryId: number;
  tagIds?: number[];
  status?: ResourceStatus;
}
export interface VideoRequest extends EbookRequest {
  videoUrl: string;
  platform: string;
}
export interface ArticleRequest extends EbookRequest {
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
}
export interface AdminResourceFilters extends Query {
  page?: number;
  size?: number;
  search?: string;
  status?: ResourceStatus;
  kind?: ResourceKind;
  categoryId?: number;
  tagId?: number;
}
export interface StatsOverview {
  users: number;
  usersByStatus: Partial<Record<'ACTIVE' | 'INACTIVE' | 'BANNED', number>>;
  usersByProvider: Partial<Record<AuthProvider, number>>;
  verifiedUsers: number;
  events: number;
  eventsByStatus: Partial<Record<EventStatus, number>>;
  eventsByType: Partial<Record<EventType, number>>;
  resources: number;
  resourcesByStatus: Partial<Record<ResourceStatus, number>>;
  resourcesByKind: Partial<Record<ResourceKind, number>>;
  resourcesByCategory: Record<string, number>;
  newsletterSubscribers: number;
  newsletterUnsubscribed: number;
}

function dataBlob(data: EbookRequest | VideoRequest) {
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}

function eventForm(data: EventRequest, coverImageFile?: File) {
  const form = new FormData();
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  if (coverImageFile) form.append('coverImageFile', coverImageFile);
  return form;
}

function ebookForm(data: EbookRequest, file?: File, coverImageFile?: File) {
  const form = new FormData();
  form.append('data', dataBlob(data));
  if (file) form.append('file', file);
  if (coverImageFile) form.append('coverImageFile', coverImageFile);
  return form;
}

function videoForm(data: VideoRequest, coverImageFile?: File) {
  const form = new FormData();
  form.append('data', dataBlob(data));
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
  resources: (filters: AdminResourceFilters = {}, signal?: AbortSignal) =>
    http.get<PageResponse<ResourceSummary>>('/resources/admin', { size: 12, sort: 'createdAt,desc', ...filters }, signal),
  createVideo: (body: VideoRequest, coverImageFile: File) => http.postForm<ResourceSummary>('/resources/admin/videos', videoForm(body, coverImageFile)),
  updateVideo: (id: number, body: VideoRequest, coverImageFile?: File) => http.putForm<ResourceSummary>(`/resources/admin/videos/${id}`, videoForm(body, coverImageFile)),
  createEbook: (data: EbookRequest, file: File, coverImageFile: File) => http.postForm<ResourceSummary>('/resources/admin/ebooks', ebookForm(data, file, coverImageFile)),
  updateEbook: (id: number, data: EbookRequest, file?: File, coverImageFile?: File) => http.putForm<ResourceSummary>(`/resources/admin/ebooks/${id}`, ebookForm(data, file, coverImageFile)),
  createArticle: (data: ArticleRequest, coverImageFile: File) => http.postForm<ResourceSummary>('/resources/admin/articles', articleForm(data, coverImageFile)),
  updateArticle: (id: number, data: ArticleRequest, coverImageFile?: File) => http.putForm<ResourceSummary>(`/resources/admin/articles/${id}`, articleForm(data, coverImageFile)),
  deleteResource: (id: number) => http.delete<void>(`/resources/admin/${id}`),
  events: (page = 0, signal?: AbortSignal) => http.get<PageResponse<EventSummary>>('/events/admin', { page, size: 12, sort: 'startDate,desc' }, signal),
  createEvent: (body: EventRequest, coverImageFile: File) => http.postForm<EventSummary>('/events/admin', eventForm(body, coverImageFile)),
  updateEvent: (id: number, body: EventRequest, coverImageFile?: File) => http.putForm<EventSummary>(`/events/admin/${id}`, eventForm(body, coverImageFile)),
  deleteEvent: (id: number) => http.delete<void>(`/events/admin/${id}`),
  createCategory: (name: string) => http.post<Category>('/admin/categories', { name }),
  renameCategory: (id: number, name: string) => http.put<Category>(`/admin/categories/${id}`, { name }),
  deleteCategory: (id: number) => http.delete<void>(`/admin/categories/${id}`),
  createTag: (name: string, categoryId: number) => http.post<Tag>('/admin/tags', { name, categoryId }),
  updateTag: (id: number, name: string, categoryId: number) => http.put<Tag>(`/admin/tags/${id}`, { name, categoryId }),
  deleteTag: (id: number) => http.delete<void>(`/admin/tags/${id}`),
  users: (page = 0, search = '', signal?: AbortSignal) =>
    http.get<PageResponse<AdminUser>>('/admin/users', { page, size: 12, search, sort: 'createdAt,desc' }, signal),
  user: (id: number, signal?: AbortSignal) => http.get<AdminUser>(`/admin/users/${id}`, undefined, signal),
  updateUserStatus: (id: number, status: AdminUser['status']) =>
    http.patch<AdminUser>(`/admin/users/${id}/status`, { status }),
  deleteUser: (id: number) => http.delete<void>(`/admin/users/${id}`),
  newsletterStats: (signal?: AbortSignal) => http.get<NewsletterStats>('/newsletter/admin/stats', undefined, signal),
  newsletterSubscriptions: (status: string | '', signal?: AbortSignal) =>
    http.get<AdminSubscriber[]>('/newsletter/admin/subscriptions', status ? { status } : undefined, signal),
  newsletterBroadcast: (subject: string, message: string) =>
    http.post<number>('/newsletter/admin/broadcast', { subject, message }),
  newsletterUnsubscribe: (userId: number) => http.post<AdminSubscriber>(`/newsletter/admin/subscriptions/${userId}/unsubscribe`),
  newsletterSubscribe: (userId: number) => http.post<AdminSubscriber>(`/newsletter/admin/subscriptions/${userId}/subscribe`),
  newsletterCampaigns: (signal?: AbortSignal) => http.get<NewsletterCampaign[]>('/newsletter/admin/campaigns', undefined, signal),
  exportUsers: () => downloadCsv('/admin/users/export', 'lescracks-users.csv'),
  exportNewsletter: () => downloadCsv('/newsletter/admin/subscriptions/export', 'lescracks-newsletter.csv'),
  userGrowth: (from: string, to: string, signal?: AbortSignal) =>
    http.get<{ from: string; to: string; points: UserGrowthPoint[] }>('/admin/stats/user-growth', { from, to }, signal),
  newsletterSubscribers: (signal?: AbortSignal) => http.get<AdminSubscriber[]>('/newsletter/admin/subscribers', undefined, signal),
  topResources: (limit = 5, signal?: AbortSignal) =>
    http.get<{ limit: number; resources: TopResource[] }>('/admin/stats/top-resources', { limit }, signal),
  admins: (signal?: AbortSignal) => http.get<AdminSummary[]>('/admin/admins', undefined, signal),
  createAdmin: (username: string, password: string) => http.post<AdminSummary>('/admin/admins', { username, password }),
  deleteAdmin: (id: number) => http.delete<void>(`/admin/admins/${id}`),
};

export default adminApi;
