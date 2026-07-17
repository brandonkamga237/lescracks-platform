// src/services/api.ts
import { ENV } from '@/config/env';
import authService from './auth';

const API_BASE_URL = ENV.API_BASE_URL;

// Types
export interface Event {
  id: string;
  slug?: string;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  type: string;
  status: string;  // open | upcoming | closed
  coverImageUrl?: string;
  applicationRequired?: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
  tags?: { id: number; name: string }[];
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  previewImageUrl?: string;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  resourceTypeId: number;
  resourceTypeName: 'VIDEO' | 'DOCUMENT';
  sourceType: 'EXTERNAL' | 'UPLOADED';
  premium: boolean;
  downloadable: boolean;
  viewCount: number;
  downloadCount: number;
  tags: { id: number; name: string }[];
  slug?: string;
  metadata?: {
    fileSize?: number;
    mimeType?: string;
    originalFileName?: string;
  };
}

export type LearnerStatus = 'EN_COURS' | 'TERMINE_AVEC_CERTIFICAT' | 'TERMINE_SANS_CERTIFICAT';

export interface Learner {
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

export interface Tag {
  id: number;
  name: string;
  /** The API has always sent this; the client used to drop it, which is why
   *  filtering tags by category was impossible and the filter silently did nothing. */
  categoryId?: number;
  categoryName?: string;
}


export interface ResourceLikes {
  count: number;
  likedByMe: boolean;
}

export interface ResourceComment {
  id: number;
  content: string;
  createdAt: string;
  authorName: string;
  authorPictureUrl?: string;
  /** True when the comment belongs to the caller — the server decides, not the client. */
  mine: boolean;
}

export interface Category {
  id: number;
  name: string;
}

// Pagination response type
export interface PaginatedResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Resource filter options
export interface ResourceFilters {
  type?: 'VIDEO' | 'DOCUMENT';
  categoryId?: number;
  tagIds?: number[];
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

class ApiService {
  // Authentication rides on the HttpOnly cookie the backend sets, which the browser
  // attaches automatically — there is no token in JS to put in a header.
  // `includeAuth` is kept only to document which endpoints require a session.
  private getHeaders(_includeAuth = false): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    const json = await response.json();

    // Handle backend response format: { success: true, data: { ... } }
    if (!response.ok) {
      throw new Error(json.message || `Request failed with status ${response.status}`);
    }

    // Return the data part if success, otherwise throw
    if (json.success && json.data !== undefined) {
      return json.data as T;
    }

    if (!json.success) {
      throw new Error(json.message || 'Request failed');
    }

    return json as T;
  }

  // === EVENTS ===
  async getEvents(filters?: { type?: string; status?: string }): Promise<Event[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const url = `/events${params.toString() ? `?${params.toString()}` : ''}`;
    const data = await this.request<Event[]>(url);
    return Array.isArray(data) ? data : [];
  }

  async getEvent(id: string): Promise<Event> {
    const data = await this.request<Event>(`/events/${id}`);
    return data;
  }

  // Public event pages resolve by slug; the numeric id stays internal.
  async getEventBySlug(slug: string): Promise<Event> {
    const data = await this.request<Event>(`/events/slug/${slug}`);
    return data;
  }

  // === RESOURCES ===
  /**
   * Get paginated and filtered resources.
   * 
   * @param filters - Filter options:
   *   - type: 'VIDEO' or 'DOCUMENT' to filter by resource type
   *   - categoryId: number to filter by category
   *   - tagIds: number[] to filter by tags (resources with ANY of these tags)
   *   - search: string to search in title/description
   *   - page: page number (0-based, default: 0)
   *   - size: page size (default: 12)
   *   - sort: sort field and direction (default: 'createdAt,desc')
   * 
   * @returns Paginated response with resources array
   */
  async getResources(filters?: ResourceFilters): Promise<PaginatedResponse<Resource>> {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters?.tagIds && filters.tagIds.length > 0) {
      params.append('tagIds', filters.tagIds.join(','));
    }
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page !== undefined) params.append('page', filters.page.toString());
    if (filters?.size) params.append('size', filters.size.toString());
    if (filters?.sort) params.append('sort', filters.sort);

    const url = `/resources${params.toString() ? `?${params.toString()}` : ''}`;
    const data = await this.request<PaginatedResponse<Resource>>(url);
    return data;
  }

  async getResource(id: string): Promise<Resource> {
    const data = await this.request<Resource>(`/resources/${id}`);
    return data;
  }

  async getResourceBySlug(slug: string): Promise<Resource> {
    return this.request<Resource>(`/resources/slug/${slug}`);
  }


  // === RESOURCE ENGAGEMENT (likes & comments) ===
  // Reading is public; liking and commenting require an account (enforced server-side).

  async getResourceLikes(resourceId: string | number): Promise<ResourceLikes> {
    return this.request<ResourceLikes>(`/resources/${resourceId}/likes`);
  }

  /** Toggle: likes if not liked, unlikes if already liked. Returns the new state. */
  async toggleResourceLike(resourceId: string | number): Promise<ResourceLikes> {
    return this.request<ResourceLikes>(`/resources/${resourceId}/likes`, { method: 'POST' }, true);
  }

  async getResourceComments(resourceId: string | number): Promise<ResourceComment[]> {
    const data = await this.request<ResourceComment[]>(`/resources/${resourceId}/comments`);
    return Array.isArray(data) ? data : [];
  }

  async addResourceComment(resourceId: string | number, content: string): Promise<ResourceComment> {
    return this.request<ResourceComment>(
      `/resources/${resourceId}/comments`,
      { method: 'POST', body: JSON.stringify({ content }) },
      true,
    );
  }

  async deleteResourceComment(resourceId: string | number, commentId: number): Promise<void> {
    await this.request<void>(
      `/resources/${resourceId}/comments/${commentId}`,
      { method: 'DELETE' },
      true,
    );
  }

  // === TAGS ===
  async getTags(): Promise<Tag[]> {
    const data = await this.request<Tag[]>('/tags');
    return Array.isArray(data) ? data : [];
  }

  // === CATEGORIES ===
  async getCategories(): Promise<Category[]> {
    const data = await this.request<Category[]>('/categories');
    return Array.isArray(data) ? data : [];
  }

  // === APPLICATIONS ===

  /** Submit a service application (Accompagnement 360 or Formation pratique) */
  async submitServiceApplication(payload: {
    applicationTypeId: number;
    fullName: string;
    emailAddress: string;
    whatsappNumber: string;
    motivationText: string;
    age?: number;
    technicalLevel?: string;
  }): Promise<{ id: number; status: string }> {
    return this.request<{ id: number; status: string }>(
      '/applications',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      false  // endpoint public — pas de token requis
    );
  }

  /** Application types, so the client can resolve an id by name instead of hard-coding it. */
  async getApplicationTypes(): Promise<{ id: number; name: string }[]> {
    const data = await this.request<{ id: number; name: string }[]>('/applications/types');
    return Array.isArray(data) ? data : [];
  }

  /**
   * Sign someone up for an event.
   *
   * This replaces EventRegistrationForm, which POSTed to a hard-coded
   * `http://localhost:5000/api/evenements/{id}/inscription` — an endpoint that has
   * never existed. Registration goes through the normal application pipeline, so a
   * sign-up shows up in the admin funnel like any other candidate.
   */
  async registerToEvent(
    eventId: string,
    payload: {
      fullName: string;
      emailAddress: string;
      whatsappNumber: string;
      motivationText?: string;
      technicalLevel?: string;
      age?: number;
    },
  ): Promise<{ id: number; status: string }> {
    const types = await this.getApplicationTypes();
    const registerType = types.find(t => t.name === 'register') ?? types.find(t => t.name === 'participate');
    if (!registerType) {
      throw new Error("L'inscription aux événements n'est pas configurée. Contacte l'équipe.");
    }

    return this.request<{ id: number; status: string }>(
      '/applications',
      {
        method: 'POST',
        body: JSON.stringify({
          eventId: Number(eventId),
          applicationTypeId: registerType.id,
          ...payload,
        }),
      },
      false, // public — signing up for an event does not require an account
    );
  }

  // === RESOURCE TRACKING ===

  /** Fire-and-forget view tracking — never throws to avoid blocking UI. */
  async trackResourceView(id: string): Promise<void> {
    try {
      await this.request<void>(`/resources/${id}/view`, { method: 'POST' });
    } catch { /* silent — tracking is non-critical */ }
  }

  /** Increment download count and get authorised URL. */
  async trackResourceDownload(id: string): Promise<string> {
    const data = await this.request<string>(`/resources/${id}/download`, { method: 'POST' }, true);
    return data;
  }

  /** Upload a file to the resource upload endpoint and return its public URL. */
  private async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/resources/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Upload failed');
    if (json.success && json.data !== undefined) return json.data as string;
    throw new Error(json.message || 'Upload failed');
  }

  /** Upload an image and get back its public URL. */
  async uploadImage(file: File): Promise<string> {
    return this.uploadFile(file);
  }

  /** Upload a resource file (PDF, video, etc.) and get back its public URL. */
  async uploadResourceFile(file: File): Promise<string> {
    return this.uploadFile(file);
  }

  // === LEARNERS (public) ===
  async getLearners(status?: LearnerStatus): Promise<Learner[]> {
    const params = status ? `?status=${status}` : '';
    const data = await this.request<Learner[]>(`/learners${params}`);
    return Array.isArray(data) ? data : [];
  }

  async getShowcasedLearners(): Promise<Learner[]> {
    const data = await this.request<Learner[]>('/learners/showcased');
    return Array.isArray(data) ? data : [];
  }

  async getLearnerBySlug(slug: string): Promise<Learner> {
    return this.request<Learner>(`/learners/${slug}`);
  }

  async getMyLearnerProfile(): Promise<Learner> {
    return this.request<Learner>('/learners/me', { headers: this.getHeaders(true) });
  }

  async updateMyLearnerProfile(data: { bio?: string; linkedinUrl?: string; portfolioUrl?: string }): Promise<Learner> {
    return this.request<Learner>('/learners/me', {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
  }

  async getMyApplications(): Promise<any[]> {
    const user = authService.getUser();
    if (!user) return [];

    const data = await this.request<any[]>(
      `/applications/user/${user.id}`,
      {},
      true
    );
    return Array.isArray(data) ? data : [];
  }
}

export const apiService = new ApiService();
export default apiService;
