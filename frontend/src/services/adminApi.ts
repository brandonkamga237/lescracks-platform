// src/services/adminApi.ts
import { ENV } from '@/config/env';
import authService from './auth';

const API_BASE_URL = ENV.API_BASE_URL;

// Types
export interface AdminUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleName: 'FREE' | 'PREMIUM' | 'ADMIN';
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
  title: string;
  description: string;
  url: string;
  previewImageUrl?: string;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  resourceTypeId: number;
  resourceTypeName: string;
}

export interface AdminApplication {
  id: number;
  userId: number;
  username: string;
  eventId?: number;
  eventTitle?: string;
  applicationTypeId: number;
  applicationTypeName: string;
  status: 'pending' | 'accepted' | 'rejected';
  motivationText?: string;
  technicalLevel?: string;
  createdAt: string;
}

export interface AdminPremiumRequest {
  id: number;
  userId: number;
  username: string;
  email: string;
  whatsappNumber: string;
  country: string;
  message?: string;
  status: 'PENDING' | 'CONTACTED' | 'PAID' | 'REJECTED';
  createdAt: string;
}

export interface AdminEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  type: string;
  status: string;
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
  premiumRequestsByStatus: { [key: string]: number };
  totalPremiumRequests: number;
  newUsersLast30Days: number;
  newUsersPrev30Days: number;
  newResourcesLast30Days: number;
  premiumConversionRate: number;
  totalViews: number;
  totalDownloads: number;
  topViewedResources: any[];
  topDownloadedResources: any[];
  dailyUsers: { date: string; count: number }[];
  recentUsers: AdminUser[];
  recentResources: AdminResource[];
}

export type LearnerStatus = 'EN_COURS' | 'TERMINE_AVEC_CERTIFICAT' | 'TERMINE_SANS_CERTIFICAT';

export interface AdminLearner {
  id: number;
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
  private getHeaders(includeAuth = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
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

  async getUser(id: number): Promise<AdminUser> {
    return this.request<AdminUser>(`/admin/users/${id}`);
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
  async getResources(page = 0, size = 20): Promise<PaginatedResponse<AdminResource>> {
    return this.request<PaginatedResponse<AdminResource>>(`/admin/resources?page=${page}&size=${size}`);
  }

  async createResource(data: {
    title: string;
    description: string;
    url: string;
    previewImageUrl?: string;
    categoryId: number;
    resourceTypeId: number;
    tagIds?: number[];
  }): Promise<AdminResource> {
    return this.request<AdminResource>('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateResource(id: number, data: {
    title: string;
    description: string;
    url: string;
    previewImageUrl?: string;
    categoryId: number;
    resourceTypeId: number;
    tagIds?: number[];
  }): Promise<AdminResource> {
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

  async updateApplicationStatus(id: number, status: string): Promise<AdminApplication> {
    return this.request<AdminApplication>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteApplication(id: number): Promise<void> {
    await this.request<void>(`/applications/${id}`, { method: 'DELETE' });
  }

  // === PREMIUM REQUESTS ===
  async getPremiumRequests(page = 0, size = 20, status?: string): Promise<PaginatedResponse<AdminPremiumRequest>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    return this.request<PaginatedResponse<AdminPremiumRequest>>(`/premium/admin/requests?${params}`);
  }

  async updatePremiumRequestStatus(id: number, status: string): Promise<AdminPremiumRequest> {
    return this.request<AdminPremiumRequest>(`/premium/admin/requests/${id}/status?status=${status}`, {
      method: 'PUT',
    });
  }

  async getPremiumStats(): Promise<{ pending: number; contacted: number; paid: number; rejected: number }> {
    return this.request(`/premium/admin/stats`);
  }

  // === EVENTS ===
  async getEvents(page = 0, size = 20): Promise<PaginatedResponse<AdminEvent>> {
    return this.request<PaginatedResponse<AdminEvent>>(`/admin/events?page=${page}&size=${size}`);
  }

  async deleteEvent(id: number): Promise<void> {
    await this.request<void>(`/admin/events/${id}`, { method: 'DELETE' });
  }

  // === OPEN SOURCE PROJECTS ===
  async getOpenSourceProjects(): Promise<any[]> {
    return this.request<any[]>('/open-source/admin/projects');
  }

  async createOpenSourceProject(data: object): Promise<any> {
    return this.request<any>('/open-source/admin/projects', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateOpenSourceProject(id: number, data: object): Promise<any> {
    return this.request<any>(`/open-source/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteOpenSourceProject(id: number): Promise<void> {
    await this.request<void>(`/open-source/admin/projects/${id}`, { method: 'DELETE' });
  }

  // === CONTRIBUTORS ===
  async getContributors(): Promise<any[]> {
    return this.request<any[]>('/open-source/admin/contributors');
  }

  async createContributor(data: object): Promise<any> {
    return this.request<any>('/open-source/admin/contributors', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateContributor(id: number, data: object): Promise<any> {
    return this.request<any>(`/open-source/admin/contributors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteContributor(id: number): Promise<void> {
    await this.request<void>(`/open-source/admin/contributors/${id}`, { method: 'DELETE' });
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
