// src/services/adminApi.ts
import { ENV } from '@/config/env';

const API_BASE_URL = ENV.API_BASE_URL;

// Types
export interface AdminUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleName: 'FREE' | 'LEARNER' | 'ADMIN';
  providerName: string;
  createdAt: string;
  enabled: boolean;
}

export interface AdminCategory {
  id: number;
  name: string;
  resourceCount?: number;
}

export interface AdminTag {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
}

export interface AdminResource {
  id: number;
  viewCount?: number;
  downloadCount?: number;
  title: string;
  description: string;
  url: string;
  content?: string;
  previewImageUrl?: string;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  resourceTypeId: number;
  resourceTypeName: string;
  sourceType?: string;
  downloadable?: boolean;
}

/**
 * Payload for creating or updating a resource.
 *
 * `url` carries the link (EXTERNAL) or the uploaded file path (UPLOADED); `content` carries
 * the body of an article (INLINE). The backend rejects a payload that has neither.
 */

/** A row of the dashboard's most-viewed / most-downloaded lists. */
export interface TopResource {
  id: number;
  title: string;
  type?: string;
  viewCount: number;
  downloadCount: number;
}

/**
 * What the event form actually sends. eventStatusId is optional because the API derives
 * the status from the dates, and the location and cover fields were missing from the old
 * inline shape although every call passed them.
 */
export interface AdminEventPayload {
  title: string;
  description?: string;
  eventDate: string;
  endDate?: string;
  location?: string;
  coverImageUrl?: string;
  applicationRequired: boolean;
  maxParticipants?: number | null;
  eventTypeId: number;
  eventStatusId?: number;
  tagIds?: number[];
}

export interface AdminResourcePayload {
  title: string;
  description: string;
  url?: string;
  content?: string;
  previewImageUrl?: string;
  categoryId: number;
  resourceTypeId: number;
  tagIds?: number[];
  sourceType?: 'EXTERNAL' | 'UPLOADED' | 'INLINE';
  downloadable?: boolean;
  readingTimeMinutes?: number;
  author?: string;
}

export interface AdminApplication {
  id: number;
  userId?: number;
  username?: string;
  eventId?: number;
  eventTitle?: string;
  applicationTypeId: number;
  applicationTypeName: string;
  /** True for an event sign-up, false for an Accompagnement 360 application. */
  eventRegistration: boolean;
  archived: boolean;
  archivedAt?: string;
  fullName?: string;
  emailAddress?: string;
  whatsappNumber?: string;
  age?: number;
  motivationText?: string;
  technicalLevel?: string;
  createdAt: string;
}

export interface AdminEvent {
  id: number;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  coverImageUrl?: string;
  type: string;
  status: string;
  applicationRequired?: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalResources: number;
  totalEvents: number;
  totalCategories: number;
  totalTags: number;
  usersByRole: { [key: string]: number };
  usersByProvider: { [key: string]: number };
  resourcesByType: { [key: string]: number };
  resourcesByCategory: { categoryName: string; count: number }[];
  eventsByStatus: { [key: string]: number };
  applicationsByStatus: { [key: string]: number };
  newUsersLast30Days: number;
  newUsersPrev30Days: number;
  newResourcesLast30Days: number;
  totalViews: number;
  totalDownloads: number;
  topViewedResources: TopResource[];
  topDownloadedResources: TopResource[];
  dailyNewUsers: { date: string; count: number }[];
  recentUsers: AdminUser[];
  recentResources: AdminResource[];
}

export type LearnerStatus = 'EN_COURS' | 'TERMINE_AVEC_CERTIFICAT' | 'TERMINE_SANS_CERTIFICAT';

export interface AdminLearner {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  fullName: string;
  slug: string;
  bio?: string;
  photoUrl?: string;
  email?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  status: LearnerStatus;
  cohort?: string;
  showcased: boolean;
  visible: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface AdminLearnerRequest {
  firstName: string;
  lastName: string;
  bio?: string;
  photoUrl?: string;
  email?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  status: LearnerStatus;
  cohort?: string;
  showcased: boolean;
  visible: boolean;
  displayOrder: number;
}

// Pagination
export interface PaginatedResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

class AdminApiService {
  // Auth rides on the HttpOnly cookie the browser attaches automatically — there is
  // no token in JS to put in a header.
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      credentials: 'include',
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || `Request failed with status ${response.status}`);
    }

    if (json.success && json.data !== undefined) {
      return json.data as T;
    }

    if (!json.success) {
      throw new Error(json.message || 'Request failed');
    }

    return json as T;
  }

  // === DASHBOARD ===
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/admin/dashboard');
  }

  // === USERS ===
  async getUsers(page = 0, size = 20): Promise<PaginatedResponse<AdminUser>> {
    return this.request<PaginatedResponse<AdminUser>>(`/admin/users?page=${page}&size=${size}`);
  }

  async updateUserRole(id: number, roleName: string): Promise<AdminUser> {
    return this.request<AdminUser>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleName }),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.request<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  // === CATEGORIES ===
  async getCategories(): Promise<AdminCategory[]> {
    return this.request<AdminCategory[]>('/admin/categories');
  }

  async createCategory(name: string): Promise<AdminCategory> {
    return this.request<AdminCategory>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async updateCategory(id: number, name: string): Promise<AdminCategory> {
    return this.request<AdminCategory>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    await this.request<void>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // === TAGS ===
  async getTags(page = 0, size = 50): Promise<PaginatedResponse<AdminTag>> {
    return this.request<PaginatedResponse<AdminTag>>(`/admin/tags?page=${page}&size=${size}`);
  }

  async createTag(name: string, categoryId: number): Promise<AdminTag> {
    return this.request<AdminTag>('/admin/tags', {
      method: 'POST',
      body: JSON.stringify({ name, categoryId }),
    });
  }

  async updateTag(id: number, name: string, categoryId: number): Promise<AdminTag> {
    return this.request<AdminTag>(`/admin/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, categoryId }),
    });
  }

  async deleteTag(id: number): Promise<void> {
    await this.request<void>(`/admin/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // === RESOURCES ===
  async getResources(
    page = 0,
    size = 20,
    filters: { type?: string; categoryId?: number; search?: string } = {},
  ): Promise<PaginatedResponse<AdminResource>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters.type) params.set('type', filters.type);
    if (filters.categoryId) params.set('categoryId', String(filters.categoryId));
    if (filters.search) params.set('search', filters.search);
    return this.request<PaginatedResponse<AdminResource>>(`/admin/resources?${params}`);
  }

  /** Type ids are database rows, not constants: always read them instead of hardcoding. */
  async getResourceTypes(): Promise<{ id: number; name: string }[]> {
    return this.request<{ id: number; name: string }[]>('/resources/types');
  }

  async createResource(data: AdminResourcePayload): Promise<AdminResource> {
    return this.request<AdminResource>('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateResource(id: number, data: AdminResourcePayload): Promise<AdminResource> {
    return this.request<AdminResource>(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResource(id: number): Promise<void> {
    await this.request<void>(`/resources/${id}`, {
      method: 'DELETE',
    });
  }

  // === APPLICATIONS / CANDIDATURES ===
  async getApplications(): Promise<AdminApplication[]> {
    return this.request<AdminApplication[]>('/applications');
  }

  async archiveApplication(id: number): Promise<AdminApplication> {
    return this.request<AdminApplication>(`/applications/${id}/archive`, { method: 'PATCH' });
  }

  async unarchiveApplication(id: number): Promise<AdminApplication> {
    return this.request<AdminApplication>(`/applications/${id}/unarchive`, { method: 'PATCH' });
  }

  async deleteApplication(id: number): Promise<void> {
    await this.request<void>(`/applications/${id}`, { method: 'DELETE' });
  }

  // === LEARNERS ===
  async assignLearnerRole(userId: number, cohort?: string): Promise<AdminLearner> {
    return this.request<AdminLearner>(`/learners/admin/assign/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ cohort: cohort ?? null }),
    });
  }

  // === EVENTS ===
  async getEvents(page = 0, size = 20): Promise<PaginatedResponse<AdminEvent>> {
    return this.request<PaginatedResponse<AdminEvent>>(`/admin/events?page=${page}&size=${size}`);
  }

  async createEvent(data: AdminEventPayload): Promise<AdminEvent> {
    return this.request<AdminEvent>('/events', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateEvent(id: number, data: AdminEventPayload): Promise<AdminEvent> {
    return this.request<AdminEvent>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async getEventTypes(): Promise<{ id: number; name: string }[]> {
    return this.request<{ id: number; name: string }[]>('/events/types');
  }

  async getEventStatuses(): Promise<{ id: number; name: string }[]> {
    return this.request<{ id: number; name: string }[]>('/events/statuses');
  }

  async deleteEvent(id: number): Promise<void> {
    await this.request<void>(`/admin/events/${id}`, { method: 'DELETE' });
  }

  // === LEARNERS ===
  async getLearners(): Promise<AdminLearner[]> {
    return this.request<AdminLearner[]>('/learners/admin/all');
  }

  async createLearner(data: AdminLearnerRequest): Promise<AdminLearner> {
    return this.request<AdminLearner>('/learners/admin', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateLearner(id: number, data: AdminLearnerRequest): Promise<AdminLearner> {
    return this.request<AdminLearner>(`/learners/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteLearner(id: number): Promise<void> {
    await this.request<void>(`/learners/admin/${id}`, { method: 'DELETE' });
  }
}

export const adminApi = new AdminApiService();
export default adminApi;
