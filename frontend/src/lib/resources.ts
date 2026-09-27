import type { ResourceSummary } from '@/services/types';

export const KIND_LABEL = { EXTERNAL_VIDEO: 'Vidéo', EBOOK: 'Ebook', ARTICLE: 'Article' } as const;

export function resourceDetail(resource: ResourceSummary): string {
  if (resource.kind === 'EBOOK') return resource.fileFormat ?? 'Document';
  if (resource.kind === 'ARTICLE') return `${resource.readingMinutes ?? 1} min`;
  return resource.platform ?? 'Vidéo externe';
}
