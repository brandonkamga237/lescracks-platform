import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, Loader2, Trophy } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { track } from '@/lib/analytics';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { EventSummary, Project, ProjectDraft, ProjectStatus } from '@/services/types';

interface ProjectSubmissionProps {
  event: EventSummary;
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  SUBMITTED: 'Soumis : tu peux encore le modifier',
  UNDER_REVIEW: 'En revue par le jury',
  ACCEPTED: 'Retenu',
  REJECTED: 'Non retenu',
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

function emptyDraft(size: number): ProjectDraft {
  return { title: '', repositoryUrl: '', demoUrl: '', description: '', teammateEmails: Array(Math.max(size - 1, 0)).fill('') };
}

function draftOf(project: Project, size: number): ProjectDraft {
  const teammates = project.team.filter((member) => !member.owner).map((member) => member.email);
  return {
    title: project.title,
    repositoryUrl: project.repositoryUrl,
    demoUrl: project.demoUrl ?? '',
    description: project.description,
    teammateEmails: [...teammates, ...Array(Math.max(size - 1 - teammates.length, 0)).fill('')],
  };
}

/** Handing in a project on the event page: the form, then the project and its review status. */
export default function ProjectSubmission({ event }: ProjectSubmissionProps) {
  const { pathname } = useLocation();
  const { isLoading, isSignedIn, isAdmin } = useSession();
  const member = isSignedIn && !isAdmin;
  const mine = useApi((signal) => (member ? api.myProject(event.id, signal) : Promise.resolve(undefined)), [event.id, member]);
  const [saved, setSaved] = useState<Project | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProjectDraft>(() => emptyDraft(event.maxTeamSize));
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const project = saved ?? mine.data ?? null;
  const closesAt = event.submissionsCloseAt ? new Date(event.submissionsCloseAt) : null;
  const open = !closesAt || closesAt.getTime() > Date.now();

  function startEditing() {
    setDraft(project ? draftOf(project, event.maxTeamSize) : emptyDraft(event.maxTeamSize));
    setFailure('');
    setEditing(true);
  }

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setBusy(true);
    setFailure('');
    try {
      const result = await api.submitProject(event.id, {
        ...draft,
        demoUrl: draft.demoUrl?.trim() || undefined,
        teammateEmails: draft.teammateEmails.map((email) => email.trim()).filter(Boolean),
      });
      if (!project) track('Projet soumis', { événement: event.slug ?? String(event.id) });
      setSaved(result);
      setEditing(false);
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'L’envoi a échoué. Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="project-heading" className="mt-12 rounded-lg border border-line-soft bg-card p-5 sm:p-8">
      <h2 id="project-heading" className="text-xl text-t1 sm:text-2xl">Ton projet</h2>
      <p className="mt-2 text-sm text-t3">
        {event.maxTeamSize > 1 ? `Seul ou en équipe, jusqu’à ${event.maxTeamSize} personnes.` : 'Projet individuel.'}
        {closesAt && <> {open ? 'Soumissions ouvertes jusqu’au' : 'Soumissions closes depuis le'} {dateFormat.format(closesAt)}.</>}
      </p>

      {isLoading || mine.loading ? (
        <p role="status" className="mt-6 flex items-center gap-2 text-sm text-t3"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />Chargement…</p>
      ) : !member ? (
        <p className="mt-6 text-sm text-t2">
          {isAdmin ? 'Les projets se consultent dans l’administration.' : <><Link to="/connexion" state={{ from: pathname }} className="link">Connecte-toi</Link> ou <Link to="/inscription" state={{ from: pathname }} className="link">crée ton compte</Link> pour soumettre ton projet.</>}
        </p>
      ) : project && !editing ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2.5 py-1 text-xs font-medium ${project.status === 'ACCEPTED' ? 'bg-gold-400 text-black' : project.status === 'REJECTED' ? 'bg-noir-800 text-t3' : 'border border-gold-400/30 text-gold-ink'}`}>
              {STATUS_LABEL[project.status]}
            </span>
            {project.rank && <span className="inline-flex items-center gap-1 text-sm font-medium text-gold-ink"><Trophy className="h-4 w-4" aria-hidden />{project.rank === 1 ? 'Lauréat' : `${project.rank}e place`}</span>}
          </div>
          <div className="min-w-0">
            <p className="break-words text-lg font-semibold text-t1">{project.title}</p>
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-t2">{project.description}</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5">Dépôt Git<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
            {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5">Démo<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>}
          </div>
          <div>
            <p className="label">Équipe</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {project.team.map((person) => (
                <li key={person.id} className="rounded-full bg-noir-800 px-3 py-1 text-sm text-t2">{person.name}{person.owner && <span className="text-t4"> · auteur</span>}</li>
              ))}
            </ul>
          </div>
          {project.editable && <button type="button" onClick={startEditing} className="btn-secondary">Modifier le projet</button>}
        </div>
      ) : !open ? (
        <p className="mt-6 text-sm text-t2">Les soumissions sont closes pour cet événement.</p>
      ) : !editing ? (
        <button type="button" onClick={startEditing} className="btn-primary mt-6">Soumettre mon projet</button>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-5" aria-busy={busy}>
          <fieldset disabled={busy} className="space-y-5">
            <legend className="sr-only">Soumettre mon projet</legend>
            <label className="block text-sm font-medium text-t2">Nom du projet
              <input required maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input mt-2" />
            </label>
            <label className="block text-sm font-medium text-t2">Lien du dépôt Git
              <input required type="url" maxLength={500} placeholder="https://github.com/…" value={draft.repositoryUrl}
                onChange={(e) => setDraft({ ...draft, repositoryUrl: e.target.value })} className="input mt-2" />
            </label>
            <label className="block text-sm font-medium text-t2">Lien de la démo <span className="font-normal text-t4">(facultatif)</span>
              <input type="url" maxLength={500} placeholder="https://…" value={draft.demoUrl ?? ''}
                onChange={(e) => setDraft({ ...draft, demoUrl: e.target.value })} className="input mt-2" />
            </label>
            <label className="block text-sm font-medium text-t2">Présentation
              <textarea required rows={6} maxLength={5000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Ce que fait le projet, les choix techniques, les défis réussis…" className="input mt-2" />
            </label>
            {draft.teammateEmails.length > 0 && (
              <div>
                <p className="text-sm font-medium text-t2">Coéquipiers <span className="font-normal text-t4">(facultatif)</span></p>
                <p className="mt-1 text-xs text-t4">Leur adresse email LesCracks : ils doivent déjà avoir un compte. Chacun recevra son attestation.</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {draft.teammateEmails.map((email, index) => (
                    <input key={index} type="email" value={email} aria-label={`Email du coéquipier ${index + 1}`} placeholder={`coequipier${index + 1}@email.com`}
                      onChange={(e) => setDraft({ ...draft, teammateEmails: draft.teammateEmails.map((value, i) => (i === index ? e.target.value : value)) })}
                      className="input" />
                  ))}
                </div>
              </div>
            )}
            {failure && <p role="alert" className="rounded border border-error/25 bg-error/5 p-3 text-sm text-error-ink">{failure}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary">{busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}{project ? 'Enregistrer' : 'Soumettre'}</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Annuler</button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
