// src/components/resources/ResourceEngagement.tsx
//
// Likes and comments. Reading is public — the count and the discussion are part of
// what makes a resource worth opening. Writing needs an account, and we say so up
// front rather than letting someone type a comment and only then be rejected.

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Trash2, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService, { ResourceComment } from '@/services/api';

interface Props {
  resourceId: string | number;
  /** Where to send someone who needs to log in, so they come back here afterwards. */
  returnTo: string;
}

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ResourceEngagement = ({ resourceId, returnTo }: Props) => {
  const { isAuthenticated } = useAuth();

  const [likes, setLikes] = useState({ count: 0, likedByMe: false });
  const [liking, setLiking] = useState(false);

  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [l, c] = await Promise.all([
        apiService.getResourceLikes(resourceId),
        apiService.getResourceComments(resourceId),
      ]);
      setLikes(l);
      setComments(c);
    } catch {
      /* engagement is secondary — never break the page over it */
    }
  }, [resourceId]);

  useEffect(() => { load(); }, [load]);

  const handleLike = async () => {
    if (!isAuthenticated || liking) return;

    // Optimistic: the button reacts instantly, then the server has the last word.
    const previous = likes;
    setLikes({
      count: likes.count + (likes.likedByMe ? -1 : 1),
      likedByMe: !likes.likedByMe,
    });
    setLiking(true);
    try {
      setLikes(await apiService.toggleResourceLike(resourceId));
    } catch {
      setLikes(previous); // put it back — we were wrong
    } finally {
      setLiking(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || posting) return;

    setPosting(true);
    setError('');
    try {
      const created = await apiService.addResourceComment(resourceId, content);
      setComments(prev => [created, ...prev]);
      setDraft('');
    } catch (err: any) {
      setError(err?.message || "Le commentaire n'a pas pu être publié.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    const previous = comments;
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
      await apiService.deleteResourceComment(resourceId, commentId);
    } catch {
      setComments(previous);
    }
  };

  const loginHref = `/connexion?redirect=${encodeURIComponent(returnTo)}`;

  return (
    <section className="mt-12">
      {/* ── Like ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pb-6 border-b border-line">
        {isAuthenticated ? (
          <button
            onClick={handleLike}
            disabled={liking}
            aria-pressed={likes.likedByMe}
            aria-label={likes.likedByMe ? 'Retirer mon like' : 'Aimer cette ressource'}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              likes.likedByMe
                ? 'bg-gold/10 border-gold/40 text-gold'
                : 'border-line text-t2 hover:border-gold/40 hover:text-gold'
            }`}
          >
            <Heart className={`w-4 h-4 ${likes.likedByMe ? 'fill-current' : ''}`} />
            <span className="tabular-nums">{likes.count}</span>
          </button>
        ) : (
          <Link
            to={loginHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-t3 hover:border-gold/40 hover:text-gold transition-colors"
            title="Connecte-toi pour aimer cette ressource"
          >
            <Heart className="w-4 h-4" />
            <span className="tabular-nums">{likes.count}</span>
          </Link>
        )}

        <span className="inline-flex items-center gap-2 text-t3 text-sm">
          <MessageSquare className="w-4 h-4" />
          <span className="tabular-nums">{comments.length}</span>
          {comments.length === 1 ? 'commentaire' : 'commentaires'}
        </span>
      </div>

      {/* ── Write ────────────────────────────────────────────────────────── */}
      <div className="py-6">
        {isAuthenticated ? (
          <form onSubmit={handlePost}>
            <label htmlFor="comment" className="sr-only">Écrire un commentaire</label>
            <textarea
              id="comment"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Partage ce que tu en as pensé, ou pose une question…"
              className="input w-full resize-y"
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="flex items-center justify-between mt-3">
              <span className="text-t4 text-xs tabular-nums">{draft.length}/2000</span>
              <button
                type="submit"
                disabled={!draft.trim() || posting}
                className="btn-primary py-2 px-5 text-sm disabled:opacity-50"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publier'}
              </button>
            </div>
          </form>
        ) : (
          <Link
            to={loginHref}
            className="flex items-center gap-3 p-4 rounded-lg border border-line text-t3 hover:border-gold/40 hover:text-t2 transition-colors"
          >
            <LogIn className="w-4 h-4 text-gold flex-shrink-0" />
            <span className="text-sm">
              <span className="text-t2 font-medium">Connecte-toi pour commenter.</span>{' '}
              Tu peux lire la discussion sans compte.
            </span>
          </Link>
        )}
      </div>

      {/* ── Thread ───────────────────────────────────────────────────────── */}
      {comments.length === 0 ? (
        <p className="text-t4 text-sm py-6 text-center">
          Aucun commentaire pour l'instant. Sois le premier.
        </p>
      ) : (
        <ul className="space-y-5">
          {comments.map(c => (
            <li key={c.id} className="flex gap-3">
              {c.authorPictureUrl ? (
                <img src={c.authorPictureUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-xs font-semibold">
                    {(c.authorName || '?').substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-t1 text-sm font-medium truncate">{c.authorName}</span>
                  <span className="text-t4 text-xs flex-shrink-0">{timeAgo(c.createdAt)}</span>
                  {c.mine && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      aria-label="Supprimer mon commentaire"
                      className="ml-auto p-1 text-t4 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-t2 text-sm mt-1 whitespace-pre-line break-words">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ResourceEngagement;
