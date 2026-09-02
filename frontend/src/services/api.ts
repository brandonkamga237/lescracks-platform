import { http } from '@/services/http';
import type {
  ApplicationResponse,
  Attestation,
  Category,
  EnrolmentTarget,
  EventDetail,
  EventKind,
  EventSummary,
  Mentorship,
  PageResponse,
  Participation,
  ProofOfWork,
  ResourceDetail,
  ResourceKind,
  ResourceSummary,
  Tag,
  UserProfile,
} from '@/services/types';

/**
 * Everything the public site and a signed-in member call.
 *
 * One module per audience: this one, and adminApi for the back office. Nothing outside
 * `services/` builds a url, so a route that moves is one edit rather than a search.
 */

export interface CatalogueFilters {
  kind?: ResourceKind;
  categoryId?: number;
  tagIds?: number[];
  search?: string;
  page?: number;
  size?: number;
}

export const api = {
  // ── Catalogue ────────────────────────────────────────────────────────────
  resources: (filters: CatalogueFilters = {}, signal?: AbortSignal) =>
    http.get<PageResponse<ResourceSummary>>('/resources', { ...filters }, signal),

  /** By slug, because that is what is in a link somebody shared. */
  resource: (slug: string, signal?: AbortSignal) =>
    http.get<ResourceDetail>(`/resources/${slug}`, undefined, signal),

  /**
   * Fire and forget: a reader's page must not wait on a statistic, and a lost view costs
   * less than a slow page.
   */
  countView: (id: number) => {
    void http.post<void>(`/resources/${id}/view`).catch(() => undefined);
  },

  // ── Events ───────────────────────────────────────────────────────────────
  events: (
    filters: { kind?: EventKind; upcoming?: boolean; page?: number; size?: number } = {},
    signal?: AbortSignal,
  ) => http.get<PageResponse<EventSummary>>('/events', { ...filters }, signal),

  event: (slug: string, signal?: AbortSignal) =>
    http.get<EventDetail>(`/events/${slug}`, undefined, signal),

  // ── Accompagnement 360 ───────────────────────────────────────────────────
  mentorship: (signal?: AbortSignal) =>
    http.get<Mentorship>('/mentorship', undefined, signal),

  // ── Taxonomy, for the catalogue filters ──────────────────────────────────
  categories: (signal?: AbortSignal) => http.get<Category[]>('/categories', undefined, signal),
  tags: (categoryId?: number, signal?: AbortSignal) =>
    http.get<Tag[]>('/tags', { categoryId }, signal),

  // ── Applying ─────────────────────────────────────────────────────────────
  /** Open on purpose: people apply first and create an account afterwards. */
  apply: (draft: {
    target: EnrolmentTarget;
    eventId?: number;
    fullName: string;
    email: string;
    phone?: string;
    motivation?: string;
  }) => http.post<ApplicationResponse>('/applications', draft),

  // ── Proof of participation ───────────────────────────────────────────────
  /** Checkable by anyone holding a code, with no account. */
  attestation: (code: string, signal?: AbortSignal) =>
    http.get<Attestation>(`/participations/attestations/${code}`, undefined, signal),

  proofOfWork: (signal?: AbortSignal) =>
    http.get<ProofOfWork>('/participations/proof-of-work', undefined, signal),

  // ── Signed in ────────────────────────────────────────────────────────────
  me: (signal?: AbortSignal) => http.get<UserProfile>('/users/me', undefined, signal),

  myParticipations: (signal?: AbortSignal) =>
    http.get<Participation[]>('/participations/me', undefined, signal),
};

export default api;
