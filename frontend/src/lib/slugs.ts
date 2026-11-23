import type { ArticleSummary, EventSummary } from '@/services/types';

export function articlePath(article: Pick<ArticleSummary, 'id' | 'slug'>): string {
  return `/blog/${article.slug || article.id}`;
}

export function eventPath(event: Pick<EventSummary, 'id' | 'slug'>): string {
  return `/rendez-vous/${event.slug || event.id}`;
}
