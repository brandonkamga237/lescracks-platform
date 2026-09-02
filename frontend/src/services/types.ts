/**
 * The shapes the API answers with.
 *
 * Written by hand against the backend records rather than generated: the surface is small,
 * and a generator would put a build step between a field being added and anyone noticing.
 * When one of these drifts, typecheck is what says so.
 */

export type ResourceKind = 'VIDEO' | 'EBOOK' | 'ARTICLE';
export type EventKind = 'BOOTCAMP' | 'WORKSHOP';
export type EventPhase = 'UPCOMING' | 'RUNNING' | 'PAST';
export type EnrolmentTarget = 'MENTORSHIP' | 'EVENT';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type ParticipationStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Media {
  id: number;
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
}

export interface ResourceSummary {
  id: number;
  slug: string;
  kind: ResourceKind;
  title: string;
  summary?: string;
  cover?: Media;
  categoryName: string;
  tags: Tag[];
  viewCount: number;
  published: boolean;
  createdAt: string;

  /**
   * What it costs the reader. Which one is filled follows `kind`: minutes for a video or an
   * article, pages for an ebook. Null when nobody recorded it.
   */
  minutes?: number;
  pages?: number;
}

/** Only the part matching `kind` is present; the API omits the other two. */
export interface ResourceDetail extends Omit<ResourceSummary, 'categoryName'> {
  categoryId: number;
  categoryName: string;
  video?: { externalUrl: string; durationSeconds?: number };
  ebook?: { downloadUrl: string; originalName: string; sizeBytes: number; pageCount?: number };
  article?: { body: unknown; authorName?: string; readingMinutes?: number };
}

export interface EventSummary {
  id: number;
  slug: string;
  kind: EventKind;
  title: string;
  summary?: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  cover?: Media;
  phase: EventPhase;
  published: boolean;
}

export interface EventDetail extends EventSummary {
  description?: string;
  capacity?: number;
  acceptingApplications: boolean;
}

export interface Mentorship {
  open: boolean;
  title: string;
  summary?: string;
  description?: string;
  cover?: Media;
}

export interface ApplicationResponse {
  id: number;
  target: EnrolmentTarget;
  eventId?: number;
  eventTitle?: string;
  fullName: string;
  email: string;
  phone?: string;
  motivation?: string;
  status: ApplicationStatus;
  hasAccount: boolean;
  decidedAt?: string;
  createdAt: string;
}

export interface Participation {
  id: number;
  target: EnrolmentTarget;
  eventId?: number;
  programme: string;
  status: ParticipationStatus;
  cohort?: string;
  startedAt: string;
  completedAt?: string;
  userId?: number;
  userName?: string;
  attestationCode?: string;
}

/** What a public check answers with: enough to trust it, nothing that identifies further. */
export interface Attestation {
  code: string;
  holderName: string;
  programme: string;
  completedAt: string;
  issuedAt: string;
}

export interface ProofOfWork {
  peopleHelped: number;
  completed: number;
  inProgress: number;
  byProgramme: Record<string, number>;
}

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  avatar?: Media;
  createdAt: string;
}
