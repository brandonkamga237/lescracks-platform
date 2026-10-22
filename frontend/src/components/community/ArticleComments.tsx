import { useEffect, useId, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { Flag, Loader2, MessageCircle, Pencil, Reply, Trash2 } from 'lucide-react';

import MemberAvatar from '@/components/community/MemberAvatar';
import MemberLink from '@/components/community/MemberLink';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { track } from '@/lib/analytics';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { ArticleComment } from '@/services/types';

const MAX_LENGTH = 2000;
const relative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

function ago(iso: string): string {
  // A clock a little ahead of the server's must not print « dans 2 minutes ».
  const seconds = Math.min((new Date(iso).getTime() - Date.now()) / 1000, 0);
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'à l’instant';
}

function failure(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

interface ComposerProps {
  initial?: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
}

function Composer({ initial = '', label, placeholder, submitLabel, autoFocus = false, onSubmit, onCancel }: ComposerProps) {
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fieldId = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(body.trim());
      setBody('');
    } catch (cause) {
      setError(failure(cause, 'L’envoi a échoué. Réessaie dans un instant.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-busy={busy}>
      <label className="sr-only" htmlFor={fieldId}>{label}</label>
      <textarea id={fieldId} rows={3} maxLength={MAX_LENGTH} required value={body} autoFocus={autoFocus} disabled={busy}
        onChange={(event) => setBody(event.target.value)} placeholder={placeholder} className="input" />
      {error && <p role="alert" className="text-sm text-error-ink">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !body.trim()} className="btn-primary">
          {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}{submitLabel}
        </button>
        {onCancel && <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary">Annuler</button>}
        {body.length > MAX_LENGTH - 200 && <span className="text-xs text-t4">{MAX_LENGTH - body.length} caractères restants</span>}
      </div>
    </form>
  );
}

const ACTION = 'inline-flex min-h-9 items-center gap-1.5 rounded text-xs font-medium text-t3 transition-colors hover:text-t1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50';

interface CommentItemProps {
  comment: ArticleComment;
  canInteract: boolean;
  onReply?: () => void;
  onChanged: () => void;
}

function CommentItem({ comment, canInteract, onReply, onChanged }: CommentItemProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete' | 'report' | 'reported'>('view');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (comment.removed || !comment.author) {
    return <p id={`commentaire-${comment.id}`} className="rounded-lg border border-dashed border-line-soft px-4 py-3 text-sm italic text-t4">Ce commentaire a été retiré.</p>;
  }
  const author = comment.author;

  async function run(action: () => Promise<unknown>, next: typeof mode, fallback: string) {
    setBusy(true);
    setError('');
    try {
      await action();
      setMode(next);
      if (next !== 'reported') onChanged();
    } catch (cause) {
      setError(failure(cause, fallback));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article id={`commentaire-${comment.id}`} className="flex scroll-mt-28 gap-3" aria-label={`Commentaire de ${author.name}`}>
      <MemberLink id={author.id} name={author.name} className="h-fit shrink-0 rounded-full no-underline">
        <MemberAvatar name={author.name} avatarUrl={author.avatarUrl} size="xs" />
        <span className="sr-only">Profil de {author.name}</span>
      </MemberLink>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <MemberLink id={author.id} name={author.name} className="font-semibold text-t1" />
          <time dateTime={comment.createdAt} title={dateFormat.format(new Date(comment.createdAt))} className="text-xs text-t4">{ago(comment.createdAt)}</time>
          {comment.editedAt && <span className="text-xs text-t4">· modifié</span>}
        </p>

        {mode === 'edit' ? (
          <div className="mt-2">
            <Composer initial={comment.body} label={`Modifier le commentaire ${comment.id}`} placeholder="" submitLabel="Enregistrer" autoFocus
              onSubmit={async (body) => { await api.editComment(comment.id, body); setMode('view'); onChanged(); }} onCancel={() => setMode('view')} />
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-line break-words text-[0.95rem] leading-relaxed text-t2">{comment.body}</p>
        )}

        {mode === 'view' && canInteract && (
          <div className="mt-1 flex flex-wrap gap-x-4">
            {onReply && <button type="button" onClick={onReply} className={ACTION}><Reply className="h-3.5 w-3.5" aria-hidden />Répondre</button>}
            {comment.mine ? (
              <>
                <button type="button" onClick={() => setMode('edit')} className={ACTION}><Pencil className="h-3.5 w-3.5" aria-hidden />Modifier</button>
                <button type="button" onClick={() => setMode('delete')} className={ACTION}><Trash2 className="h-3.5 w-3.5" aria-hidden />Supprimer</button>
              </>
            ) : (
              <button type="button" onClick={() => setMode('report')} className={ACTION}><Flag className="h-3.5 w-3.5" aria-hidden />Signaler</button>
            )}
          </div>
        )}

        {mode === 'delete' && (
          <div role="group" aria-label="Confirmer la suppression" className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-line-soft bg-noir-900 p-3 text-sm text-t2">
            Supprimer ce commentaire ?
            <button type="button" disabled={busy} onClick={() => void run(() => api.deleteComment(comment.id), 'view', 'La suppression a échoué.')}
              className="font-medium text-error-ink underline-offset-4 hover:underline disabled:opacity-50">Supprimer</button>
            <button type="button" disabled={busy} onClick={() => setMode('view')} className="text-t3 underline-offset-4 hover:underline">Annuler</button>
          </div>
        )}

        {mode === 'report' && (
          <form onSubmit={(event) => { event.preventDefault(); void run(() => api.reportComment(comment.id, reason.trim() || undefined), 'reported', 'Le signalement a échoué.'); }}
            className="mt-2 space-y-3 rounded-lg border border-line-soft bg-noir-900 p-3">
            <label className="block text-sm text-t2">Pourquoi le signaler ? <span className="text-t4">(facultatif)</span>
              <input maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Spam, propos blessants, hors sujet…" className="input mt-2" />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className="btn-primary">Envoyer le signalement</button>
              <button type="button" disabled={busy} onClick={() => setMode('view')} className="btn-secondary">Annuler</button>
            </div>
          </form>
        )}

        {mode === 'reported' && <p role="status" className="mt-2 text-sm text-gold-ink">Merci, l’équipe va regarder ce commentaire.</p>}
        {error && <p role="alert" className="mt-2 text-sm text-error-ink">{error}</p>}
      </div>
    </article>
  );
}

interface ArticleCommentsProps {
  resourceId: number;
  /** Where the reader comes back after signing in. */
  returnPath: string;
  articleSlug: string;
  /** Reports the number of visible comments, for the counters kept elsewhere on the page. */
  onCountChange?: (count: number) => void;
}

/** The discussion under an article: anyone reads it, members write, reply one level deep and report. */
export default function ArticleComments({ resourceId, returnPath, articleSlug, onCountChange }: ArticleCommentsProps) {
  const { hash } = useLocation();
  const { isLoading, isSignedIn, isAdmin, signIn } = useSession();
  const member = isSignedIn && !isAdmin;
  const threads = useApi((signal) => api.comments(resourceId, signal), [resourceId, isSignedIn]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const list = threads.data ?? [];
  const count = list.reduce((total, thread) => total + (thread.comment.removed ? 0 : 1) + thread.replies.length, 0);

  useEffect(() => { onCountChange?.(count); }, [count, onCountChange]);

  // Arriving from a reply email (#commentaire-12): the comments load after the page, so scroll once they are there.
  useEffect(() => {
    if (!threads.data || !hash.startsWith('#commentaire-')) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' });
  }, [threads.data, hash]);

  async function post(body: string, parentId?: number) {
    await api.postComment(resourceId, body, parentId);
    track(parentId ? 'Réponse publiée' : 'Commentaire publié', { article: articleSlug });
    setReplyingTo(null);
    threads.reload();
  }

  return (
    <section id="discussion" aria-labelledby="comments-heading" className="mt-16 max-w-[42rem] scroll-mt-24">
      <h2 id="comments-heading" className="flex items-center gap-3 text-2xl text-t1">
        <MessageCircle className="h-6 w-6 text-gold-ink" aria-hidden />Discussion{count > 0 && <span className="text-base font-normal text-t3">({count})</span>}
      </h2>

      <div className="mt-6">
        {isLoading ? null : member ? (
          <Composer label="Ton commentaire" placeholder="Une question, un retour d’expérience, une précision ?" submitLabel="Publier" onSubmit={(body) => post(body)} />
        ) : isAdmin ? (
          <p className="text-sm text-t3">Les commentaires se modèrent depuis l’administration.</p>
        ) : (
          <div className="rounded-lg border border-line-soft bg-card p-5">
            <p className="text-sm text-t2">Connecte-toi pour poser une question ou partager ton expérience.</p>
            <button type="button" onClick={() => signIn(returnPath)} className="btn-primary mt-4">Se connecter pour commenter</button>
          </div>
        )}
      </div>

      <div className="mt-10">
        {threads.loading ? (
          <p role="status" className="flex items-center gap-2 text-sm text-t3"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />Chargement des commentaires…</p>
        ) : threads.error ? (
          <p className="text-sm text-t3">Les commentaires n’ont pas pu être chargés. <button type="button" onClick={threads.reload} className="link">Réessayer</button></p>
        ) : list.length === 0 ? (
          <p className="text-sm text-t3">Aucun commentaire pour l’instant. {member ? 'Lance la discussion !' : ''}</p>
        ) : (
          <ol className="space-y-8">
            {list.map(({ comment, replies }) => {
              const answer = member && !comment.removed ? () => setReplyingTo(comment.id) : undefined;
              return (
                <li key={comment.id}>
                  <CommentItem comment={comment} canInteract={member} onReply={answer} onChanged={threads.reload} />
                  {(replies.length > 0 || replyingTo === comment.id) && (
                    <ol className="ml-[18px] mt-4 space-y-5 border-l border-line-soft pl-5 sm:pl-7">
                      {replies.map((reply) => (
                        <li key={reply.id}><CommentItem comment={reply} canInteract={member} onReply={answer} onChanged={threads.reload} /></li>
                      ))}
                      {replyingTo === comment.id && (
                        <li>
                          <Composer label={`Répondre au commentaire ${comment.id}`} placeholder={`Répondre à ${comment.author?.name ?? 'ce commentaire'}…`} submitLabel="Répondre" autoFocus
                            onSubmit={(body) => post(body, comment.id)} onCancel={() => setReplyingTo(null)} />
                        </li>
                      )}
                    </ol>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
