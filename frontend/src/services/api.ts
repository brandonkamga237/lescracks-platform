import { http } from '@/services/http';
import type { Query } from '@/services/http';
import type {
  Category, EventFormat, EventSummary, EventType, PageResponse, ResourceKind,
  NewsletterStatus, ResourceLikeStatus, ResourceSummary, Tag, UserProfile,
} from '@/services/types';

export interface CatalogueFilters extends Query {
  kind?: ResourceKind;
  categoryId?: number;
  search?: string;
  tagId?: number;
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
  resource: (id: number, signal?: AbortSignal) =>
    http.get<ResourceSummary>(`/resources/${id}`, undefined, signal),
  events: (filters: { type?: EventType; format?: EventFormat; page?: number; size?: number } = {}, signal?: AbortSignal) =>
    http.get<PageResponse<EventSummary>>('/events', filters, signal),
  upcomingEvents: (page = 0, size = 12, signal?: AbortSignal) =>
    http.get<PageResponse<EventSummary>>('/events/upcoming', { page, size }, signal),
  pastEvents: (page = 0, size = 12, signal?: AbortSignal) =>
    http.get<PageResponse<EventSummary>>('/events/past', { page, size }, signal),
  event: (id: number, signal?: AbortSignal) =>
    http.get<EventSummary>(`/events/${id}`, undefined, signal),
  categories: (signal?: AbortSignal) => http.get<Category[]>('/categories', undefined, signal),
  tags: (categoryId?: number, signal?: AbortSignal) => http.get<Tag[]>('/tags', { categoryId }, signal),
  me: (signal?: AbortSignal) => http.get<UserProfile>('/me', undefined, signal),
  updateProfile: (body: Pick<UserProfile, 'firstName' | 'lastName'>) => http.patch<UserProfile>('/me', body),
  changePassword: (body: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    http.post<void>('/me/password', body),
  newsletterStatus: (signal?: AbortSignal) => http.get<NewsletterStatus>('/newsletter', undefined, signal),
  newsletterSubscribe: () => http.post<NewsletterStatus>('/newsletter/subscribe'),
  verifyEmail: (token: string) => http.post<void>('/auth/verify-email', undefined, { token }),
  resendVerification: (email: string) => http.post<void>('/auth/resend-verification', { email }),
  resourceLikes: (id: number, signal?: AbortSignal) => http.get<ResourceLikeStatus>(`/resources/${id}/likes`, undefined, signal),
  likeResource: (id: number) => http.post<ResourceLikeStatus>(`/resources/${id}/likes`),
  unlikeResource: (id: number) => http.delete<ResourceLikeStatus>(`/resources/${id}/likes`),
};

export default api;