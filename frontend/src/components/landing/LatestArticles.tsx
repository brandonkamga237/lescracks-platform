import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { Reveal, RevealWords, StaggerItem, StaggerList } from '@/components/motion/Reveal';
import { articlePath } from '@/lib/slugs';
import type { ArticleSummary } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/** The three latest articles, as rows that open on hover. */
export default function LatestArticles({ articles }: { articles: ArticleSummary[] }) {
  return (
    <section id="blog" aria-labelledby="articles-title">
      <div className="mx-auto max-w-[1320px] px-4 pb-28 pt-16 sm:px-8 sm:pt-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal><p className="text-sm font-medium text-gold-400">Blog</p></Reveal>
            <RevealWords
              id="articles-title"
              parts={['À lire.', { text: 'Les derniers articles du blog.', className: 'text-white/40' }]}
              className="mt-5 max-w-2xl text-[clamp(2rem,4.6vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.04em]"
            />
          </div>
          <Reveal>
            <Link to="/blog" className="group inline-flex shrink-0 items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
              Tous les articles <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <StaggerList className="mt-14 border-t border-white/10">
          {articles.map((article) => {
            const published = article.publishedAt ?? article.createdAt;
            const meta = `${article.categoryName} · ${article.readingMinutes ?? 1} min`;
            return (
              <StaggerItem key={article.id}>
                <Link to={articlePath(article)} className="group relative isolate grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 border-b border-white/10 py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)_12rem_auto] sm:gap-8">
                  <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white/[0.03] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />
                  <span className="ml-2 hidden aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-gold-400/20 to-white/[0.03] sm:block">
                    {article.coverImage && (
                      <img src={article.coverImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-110 group-hover:grayscale-0" />
                    )}
                  </span>
                  <span className="min-w-0 pl-2 sm:pl-0">
                    <span className="block text-lg font-medium tracking-tight transition-[color,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-2 group-hover:text-gold-400 sm:text-xl">{article.title}</span>
                    <span className="mt-1 block text-sm text-white/50 sm:hidden">{meta}</span>
                  </span>
                  <span className="hidden text-sm leading-relaxed text-white/45 sm:block">
                    {article.categoryName}
                    <br />
                    <time dateTime={published}>{dateFormat.format(new Date(published))}</time> · {article.readingMinutes ?? 1} min
                  </span>
                  <span className="mr-2 grid h-11 w-11 place-items-center rounded-full border border-white/20 transition-[background-color,border-color,color,transform] duration-300 group-hover:-rotate-45 group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-black">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </div>
    </section>
  );
}
