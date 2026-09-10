export type ResourceKind = 'EBOOK' | 'EXTERNAL_VIDEO' | 'ARTICLE';
export type ResourceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type EventType = 'BOOTCAMP' | 'WORKSHOP' | 'WEBINAR' | 'CONFERENCE';
export type EventFormat = 'ONLINE' | 'OFFLINE' | 'HYBRID';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Category { id: number; name: string; slug?: string; description?: string; }
export interface Tag { id: number; name: string; categoryId: number; categoryName: string; }

export interface ResourceSummary {
  id: number;
  slug?: string;
  title: string;
  description: string;
  coverImage: string;
  status: ResourceStatus;
  categoryId: number;
  categoryName: string;
  kind: ResourceKind;
  videoUrl?: string;
  platform?: string;
  downloadUrl?: string;
  fileFormat?: string;
  fileSize?: number;
  body?: unknown;
  readingMinutes?: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  likeCount: number;
}

export type ResourceDetail = ResourceSummary;

export interface ResourceLikeStatus {
  count: number;
  liked: boolean;
}

export interface EventSummary {
  id: number;
  slug?: string;
  title: string;
  description: string;
  type: EventType;
  format: EventFormat;
  startDate: string;
  endDate?: string;
  location?: string;
  coverImage?: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export type EventDetail = EventSummary;

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  verified: boolean;
  provider: AuthProvider;
  createdAt: string;
}

export interface AdminSummary {
  id: number;
  username: string;
  role: string;
}

export type NewsletterState = 'SUBSCRIBED' | 'UNSUBSCRIBED';

export interface AdminSubscriber {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  status: NewsletterState;
  subscribedAt: string | null;
  unsubscribedAt: string | null;
}

export interface NewsletterStats {
  subscribed: number;
  unsubscribed: number;
}

export interface UserGrowthPoint {
  date: string;
  count: number;
}

export interface TopResource {
  id: number;
  title: string;
  likes: number;
}

export interface NewsletterCampaign {
  id: number;
  subject: string;
  message: string;
  recipientCount: number;
  sentAt: string;
}

export interface NewsletterStatus {
  status: NewsletterState;
  subscribedAt: string | null;
  unsubscribedAt: string | null;
}

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'GITHUB';

export interface UserIdentity {
  provider: AuthProvider;
  linkedAt: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  verified: boolean;
  provider: AuthProvider;
  createdAt: string;
  identities: UserIdentity[];
  username?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  socialLinks?: Record<string, string>;
}

export interface UserProfileUpdate {
  firstName: string;
  lastName: string;
  username?: string;
  bio?: string;
  location?: string;
  socialLinks?: Record<string, string>;
}