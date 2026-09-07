import { http } from '@/services/http';
import type { Query } from '@/services/http';
import type { Category, EventFormat, EventStatus, EventSummary, EventType, PageResponse, ResourceKind, ResourceStatus, ResourceSummary, Tag } from '@/services/types';

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
  events: number;
  eventsByStatus: Partial<Record<EventStatus, number>>;
  resources: number;
  resourcesByStatus: Partial<Record<ResourceStatus, number>>;
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
};

export default adminApi;
