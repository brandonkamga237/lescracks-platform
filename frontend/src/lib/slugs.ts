import type { EventSummary, ResourceSummary } from '@/services/types';

export function resourcePath(resource: Pick<ResourceSummary, 'id' | 'slug'>): string {
  return `/ressources/${resource.slug || resource.id}`;
}

export function eventPath(event: Pick<EventSummary, 'id' | 'slug'>): string {
  return `/evenements/${event.slug || event.id}`;
}
