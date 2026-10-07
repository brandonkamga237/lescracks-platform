import { forwardRef } from 'react';

import { ArticleBlocks } from '@/components/resources/ArticleRenderer';
import type { ArticleBlock } from '@/services/types';

interface ArticlePreviewProps {
  title: string;
  description: string;
  coverUrl: string | null;
  categoryName?: string;
  minutes: number;
  blocks: ArticleBlock[];
  device: 'desktop' | 'mobile';
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

/**
 * The public article page as a reader will get it: same header band, same standfirst,
 * same block renderer. Only the page chrome (navigation, share aside) is left out.
 */
const ArticlePreview = forwardRef<HTMLDivElement, ArticlePreviewProps>(function ArticlePreview(
  { title, description, coverUrl, categoryName, minutes, blocks, device },
  ref,
) {
  const phone = device === 'mobile';
  return (
    <div ref={ref} className="relative h-full overflow-y-auto bg-black">
      <div className={phone ? 'mx-auto my-8 w-[390px] max-w-[calc(100%-2rem)] overflow-hidden rounded-[1.75rem] border border-line' : ''}>
        <header className={`mode-raised ${phone ? 'px-5 pb-10 pt-8' : 'px-8 pb-14 pt-10 xl:px-12'}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-gold-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-black">Article</span>
            {categoryName && <span className="label">{categoryName}</span>}
          </div>
          <h1 className={`mt-5 break-words font-display font-bold tracking-tight text-t1 ${title ? '' : 'opacity-40'} ${phone ? 'text-[2.5rem] leading-[0.96]' : 'text-5xl leading-[0.94] xl:text-6xl xl:leading-[0.92]'}`}>
            {title || 'Titre de l’article'}
          </h1>
          <p className="label mt-6">Publié le {dateFormat.format(new Date())} · {minutes} min de lecture</p>
        </header>
        <div className={phone ? 'px-5 py-10' : 'px-8 py-14 xl:px-12'}>
          <div className="aspect-[16/9] max-w-[42rem] overflow-hidden bg-noir-800">
            {coverUrl
              ? <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full items-center justify-center text-sm text-t4">Couverture à ajouter dans les réglages</div>}
          </div>
          <p className={`mt-10 max-w-[42rem] whitespace-pre-line break-words text-xl font-medium leading-relaxed text-t1 sm:text-[1.375rem] ${description ? '' : 'opacity-40'}`}>
            {description || 'Le chapô apparaîtra ici.'}
          </p>
          <hr className="my-10 max-w-[42rem] border-line-soft" />
          {blocks.length ? <ArticleBlocks blocks={blocks} /> : <p className="text-t4">Le corps de l’article apparaîtra ici au fil de l’écriture.</p>}
        </div>
      </div>
    </div>
  );
});

export default ArticlePreview;
