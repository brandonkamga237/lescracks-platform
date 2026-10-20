export type ResourceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type EventType = 'BOOTCAMP' | 'WORKSHOP' | 'WEBINAR' | 'CONFERENCE' | 'HACKATHON';
export type EventFormat = 'ONLINE' | 'OFFLINE' | 'HYBRID';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** A theme: what the blog filters on and what members pick as interests. */
export interface Category { id: number; name: string; slug?: string; description?: string; }
/** A blog theme that holds published articles, with how many. */
export interface BlogTheme { id: number; name: string; slug: string; description?: string; articleCount: number; }
/** A word on an article, unique by name. */
export interface Tag { id: number; name: string; }


/** An article as the back office sees it: drafts and scheduled ones included. */
export interface AdminArticle extends ArticleSummary {
  status: ResourceStatus;
  /** Set on a draft that goes public automatically at that time. */
  scheduledAt?: string;
}

/** A blog article as the public API returns it. */
export interface ArticleSummary {
  id: number;
  slug?: string;
  title: string;
  description: string;
  coverImage: string;
  categoryId: number;
  categoryName: string;
  body?: unknown;
  readingMinutes?: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  likeCount: number;
  publishedAt?: string;
}

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
  /** Set on a draft that goes public automatically at that time. */
  scheduledAt?: string;
  /** Different people who opened the event page, members and anonymous visitors alike. */
  viewCount: number;
}

export type EventDetail = EventSummary;

export type TalkStatus = 'DRAFT' | 'PUBLISHED';

export interface TalkVideo {
  id: number;
  title: string;
  description: string;
  guest?: string;
  youtubeUrl: string;
  /** Uploaded cover; when absent the YouTube thumbnail is used. */
  coverImage?: string;
  durationMinutes?: number;
  publishedAt?: string;
  status: TalkStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  verified: boolean;
  provider: AuthProvider;
  createdAt: string;
  phone?: string;
  country?: string;
  situation?: MemberSituation;
  goal?: MemberGoal;
  location?: string;
  marketingConsent: boolean;
  completion: number;
  /** False for a newsletter-only contact (no password, no social login). */
  hasAccount: boolean;
  onboarded: boolean;
  lastSeenAt?: string;
  /** The page the member first arrived on. */
  signupPath?: string;
}

export interface AdminSummary {
  id: number;
  username: string;
  role: string;
}

/** PENDING: signed up from the public form, address not confirmed yet. */
export type NewsletterState = 'PENDING' | 'SUBSCRIBED' | 'UNSUBSCRIBED';

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
  pending: number;
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

export interface AudienceStats {
  available: boolean;
  days: number;
  visitors: number | null;
  previousVisitors: number | null;
  visits: number | null;
  previousVisits: number | null;
  pageviews: number | null;
  previousPageviews: number | null;
  bounceRate: number | null;
  avgVisitSeconds: number | null;
  series: { date: string; pageviews: number; visits: number }[];
  sources: { name: string; count: number }[];
  countries: { name: string; count: number }[];
  topPages: { name: string; count: number }[];
  /** Custom events the site sends: sign-up clicks, newsletter, WhatsApp, articles read to the end. */
  events: { name: string; count: number }[];
}

export interface ViewedResource {
  id: number;
  slug: string;
  title: string;
  coverImage: string | null;
  category: string | null;
  views: number;
}

export interface ViewedEvent {
  id: number;
  slug: string;
  title: string;
  startDate: string;
  status: string;
  views: number;
}

/** Who the members are; every list counts members, fullest first, keyed by enum name or theme name. */
export interface MemberPortrait {
  members: number;
  situations: { name: string; count: number }[];
  goals: { name: string; count: number }[];
  countries: { name: string; count: number }[];
  interests: { name: string; count: number }[];
  providers: { name: string; count: number }[];
}

export interface ContentViews {
  available: boolean;
  days: number;
  resources: ViewedResource[];
  events: ViewedEvent[];
}

export interface WatchSignal {
  key: string;
  severity: 'info' | 'warning';
  title: string;
  detail: string;
  actionLabel: string;
  actionTo: string;
}

// Inline marks inside a text field: **bold**, *italic*, `code`, [label](url).
export type CalloutTone = 'tip' | 'note' | 'warning';

export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: { text: string }[]; ordered?: boolean }
  | { type: 'code'; text: string; language?: string }
  | { type: 'callout'; tone: CalloutTone; text: string }
  | { type: 'image'; url: string; alt?: string; caption?: string }
  | { type: 'link'; url: string; text: string }
  | { type: 'divider' };

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
  /** E.164, e.g. +237677123456. */
  phone?: string;
  /** ISO 3166 alpha-2, derived from the phone number. */
  country?: string;
  situation?: MemberSituation;
  goal?: MemberGoal;
  interestIds: number[];
  marketingConsent: boolean;
  /** The welcome questions are still to be shown (neither answered nor put off). */
  onboardingRequired: boolean;
  /** 0 to 100. */
  completion: number;
  missing: ProfileField[];
}

export type MemberSituation = 'STUDENT' | 'EMPLOYED' | 'CAREER_CHANGE' | 'JOB_SEEKING' | 'FREELANCE';
export type MemberGoal = 'FIND_JOB' | 'LEVEL_UP' | 'FREELANCE' | 'BUILD_PROJECT';
export type ProfileField = 'PHONE' | 'SITUATION' | 'INTERESTS' | 'GOAL' | 'CITY' | 'AVATAR' | 'BIO';

export interface SignupContext { path?: string; language?: string; timezone?: string; }

export interface OnboardingAnswers {
  phone?: string;
  situation?: MemberSituation;
  goal?: MemberGoal;
  interestIds?: number[];
  location?: string;
  marketingConsent?: boolean;
  context?: SignupContext;
}

/** A partial change: an omitted field stays as it is, an empty string clears an optional one. */
export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  location?: string;
  socialLinks?: Record<string, string>;
  phone?: string;
  situation?: MemberSituation;
  goal?: MemberGoal;
  interestIds?: number[];
  marketingConsent?: boolean;
}
// ── CrackLab ──────────────────────────────────────────────────────────────

export type ChallengeDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ChallengeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SubmissionStatus = 'SUBMITTED' | 'GRADED';

export interface ChallengeCriterion { id: number; label: string; maxPoints: number; }

export interface ChallengeSummary {
  id: number;
  slug: string;
  title: string;
  category: string;
  difficulty: ChallengeDifficulty;
  tags: string[];
  expectedFormat?: string;
  maxWords?: number;
  totalPoints: number;
  submissionCount: number;
  publishedAt?: string;
  gradedCount: number;
  averageScore?: number;
  bestScore?: number;
  /** Viewer-specific: always false and empty for visitors. */
  answered?: boolean;
  myScore?: number;
}

/** `referenceSolution` and `mySubmission` are set only once the viewer has answered. */
export interface ChallengeDetail extends ChallengeSummary {
  problem: string;
  constraints?: string;
  criteria: ChallengeCriterion[];
  referenceSolution?: string;
  mySubmission?: ChallengeSubmission;
}

export interface CrackLabMember { id: number; displayName: string; avatarUrl?: string; }

export interface CrackLabLevel { number: number; name: string; minXp: number; }

export interface CrackLabBadge { code: string; label: string; description: string; unlocked: boolean; }

export interface CrackLabHistoryItem {
  submissionId: number;
  challengeSlug: string;
  challengeTitle: string;
  category: string;
  difficulty: ChallengeDifficulty;
  status: SubmissionStatus;
  score?: number;
  totalPoints: number;
  createdAt: string;
}

/** A member's standing. `rank` is 0 until a first answer is graded; `nextLevel` is absent at the top. */
export interface CrackLabProgress {
  member: CrackLabMember;
  xp: number;
  level: CrackLabLevel;
  nextLevel?: CrackLabLevel;
  rank: number;
  rankedMembers: number;
  betterThanPercent: number;
  pointsToNextRank: number;
  weekScore: number;
  answered: number;
  graded: number;
  averagePercent: number;
  bestPercent: number;
  streak: number;
  activeThisWeek: boolean;
  bestStreak: number;
  badges: CrackLabBadge[];
  history: CrackLabHistoryItem[];
  me: boolean;
}

/** A shared result: score and standing only, the answer stays private. */
export interface CrackLabPublicResult {
  submissionId: number;
  challenge: ChallengeSummary;
  author: CrackLabMember;
  authorLevel: CrackLabLevel;
  status: SubmissionStatus;
  score?: number;
  totalPoints: number;
  rankOnChallenge: number;
  betterThanPercent: number;
  gradedAt?: string;
}

export type RankingPeriod = 'all' | 'week';

export interface SubmissionEvaluation { criterionId: number; label: string; maxPoints: number; points: number; feedback?: string; }

export interface ChallengeSubmission {
  id: number;
  challengeId: number;
  challengeSlug: string;
  challengeTitle: string;
  author: CrackLabMember;
  answer: string;
  wordCount: number;
  technicalScore?: number;
  totalPoints: number;
  voteScore: number;
  myVote: -1 | 0 | 1;
  mine: boolean;
  status: SubmissionStatus;
  createdAt: string;
  gradedAt?: string;
  evaluations: SubmissionEvaluation[];
}

export interface RankingEntry { rank: number; member: CrackLabMember; totalScore: number; challenges: number; me: boolean; level: CrackLabLevel; }

export interface AdminChallenge extends ChallengeDetail {
  referenceSolution: string;
  status: ChallengeStatus;
  createdBy: string;
  pendingCount: number;
  /** A graded answer exists: criteria and points are frozen, labels only. */
  gradingLocked: boolean;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
}
