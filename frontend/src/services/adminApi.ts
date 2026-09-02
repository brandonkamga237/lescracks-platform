import { http } from '@/services/http';
import type {
  ApplicationResponse,
  ApplicationStatus,
  Category,
  EnrolmentTarget,
  EventDetail,
  EventKind,
  EventSummary,
  Media,
  Mentorship,
  PageResponse,
  Participation,
  ParticipationStatus,
  ResourceDetail,
  ResourceSummary,
  Tag,
} from '@/services/types';

/**
 * The back office.
 *
 * Deliberately the smallest set that keeps the platform alive: publish a resource, open or
 * close the 360, decide a candidature, record that somebody finished. Anything beyond that
 * waits until it is actually needed rather than being built because a table exists.
 */

export interface ResourceCommon {
  title: string;
  summary?: string;
  categoryId: number;
  tagIds?: number[];
  coverId?: number;
}

export interface EventDraft {
  kind: EventKind;
  title: string;
  summary?: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  capacity?: number;
  coverId?: number;
}

export const adminApi = {
  // ── Catalogue ────────────────────────────────────────────────────────────
  resources: (page = 0, signal?: AbortSignal) =>
    http.get<PageResponse<ResourceSummary>>('/resources/admin', { page, size: 50 }, signal),

  createVideo: (body: { common: ResourceCommon; externalUrl: string; durationSeconds?: number }) =>
    http.post<ResourceDetail>('/resources/admin/videos', body),

  updateVideo: (id: number, body: { common: ResourceCommon; externalUrl: string; durationSeconds?: number }) =>
    http.put<ResourceDetail>(`/resources/admin/videos/${id}`, body),

  createArticle: (body: { common: ResourceCommon; body: unknown; authorName?: string }) =>
    http.post<ResourceDetail>('/resources/admin/articles', body),

  updateArticle: (id: number, body: { common: ResourceCommon; body: unknown; authorName?: string }) =>
    http.put<ResourceDetail>(`/resources/admin/articles/${id}`, body),

  /** The file travels beside the description rather than encoded inside it. */
  createEbook: (data: { common: ResourceCommon; pageCount?: number }, file: File) => {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    form.append('file', file);
    return http.postForm<ResourceDetail>('/resources/admin/ebooks', form);
  },

  /** Publishing is deliberate, never a side effect of editing. */
  publishResource: (id: number, published: boolean) =>
    http.put<ResourceDetail>(`/resources/admin/${id}/published`, undefined, { published }),

  deleteResource: (id: number) => http.delete<void>(`/resources/admin/${id}`),

  // ── Events ───────────────────────────────────────────────────────────────
  events: (page = 0, signal?: AbortSignal) =>
    http.get<PageResponse<EventSummary>>('/events/admin', { page, size: 50 }, signal),

  createEvent: (draft: EventDraft) => http.post<EventDetail>('/events/admin', draft),
  updateEvent: (id: number, draft: EventDraft) => http.put<EventDetail>(`/events/admin/${id}`, draft),
  publishEvent: (id: number, published: boolean) =>
    http.put<EventDetail>(`/events/admin/${id}/published`, undefined, { published }),
  deleteEvent: (id: number) => http.delete<void>(`/events/admin/${id}`),

  // ── Applications ─────────────────────────────────────────────────────────
  applications: (
    filters: { status?: ApplicationStatus; target?: EnrolmentTarget; page?: number } = {},
    signal?: AbortSignal,
  ) => http.get<PageResponse<ApplicationResponse>>('/applications/admin', { ...filters, size: 50 }, signal),

  /** Deciding records the answer; turning it into a participation is a second, deliberate step. */
  decide: (id: number, outcome: Exclude<ApplicationStatus, 'PENDING'>) =>
    http.put<ApplicationResponse>(`/applications/admin/${id}/decision`, undefined, { outcome }),

  // ── Participations and attestations ──────────────────────────────────────
  participations: (
    filters: { status?: ParticipationStatus; page?: number } = {},
    signal?: AbortSignal,
  ) => http.get<PageResponse<Participation>>('/participations/admin', { ...filters, size: 50 }, signal),

  enrolFromApplication: (applicationId: number, body: { cohort?: string; startedAt?: string } = {}) =>
    http.post<Participation>(`/participations/admin/from-application/${applicationId}`, body),

  /** Completing is what issues the attestation, and it issues exactly one. */
  complete: (id: number, completedOn?: string) =>
    http.put<{ code: string }>(`/participations/admin/${id}/complete`, undefined, { completedOn }),

  abandon: (id: number) => http.put<void>(`/participations/admin/${id}/abandon`),

  // ── Accompagnement 360 ───────────────────────────────────────────────────
  setMentorshipOpen: (open: boolean) =>
    http.put<Mentorship>('/mentorship/admin/open', undefined, { open }),

  updateMentorship: (body: {
    title: string;
    summary?: string;
    description?: string;
    coverId?: number;
  }) => http.put<Mentorship>('/mentorship/admin', body),

  // ── Taxonomy ─────────────────────────────────────────────────────────────
  createCategory: (name: string) => http.post<Category>('/admin/categories', { name }),
  renameCategory: (id: number, name: string) =>
    http.put<Category>(`/admin/categories/${id}`, { name }),
  deleteCategory: (id: number) => http.delete<void>(`/admin/categories/${id}`),

  createTag: (name: string, categoryId: number) =>
    http.post<Tag>('/admin/tags', { name, categoryId }),
  updateTag: (id: number, name: string, categoryId: number) =>
    http.put<Tag>(`/admin/tags/${id}`, { name, categoryId }),
  deleteTag: (id: number) => http.delete<void>(`/admin/tags/${id}`),

  // ── Media ────────────────────────────────────────────────────────────────
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.postForm<Media>('/media', form);
  },
};

export default adminApi;
