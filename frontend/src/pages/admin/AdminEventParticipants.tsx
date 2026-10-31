import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, Info, Loader2 } from 'lucide-react';

import { AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import EventCertificates from '@/components/admin/EventCertificates';
import WriteToRegistrants from '@/components/admin/WriteToRegistrants';
import { SEGMENT, Segmented } from '@/components/admin/viz';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { AdminProject, AdminRegistration, ProjectStatus, RegistrationStatus } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const ATTENDANCE_LABEL: Record<RegistrationStatus, string> = {
  REGISTERED: 'Inscrit', CANCELLED: 'Annulé', ATTENDED: 'Présent', ABSENT: 'Absent',
};

const PROJECT_LABEL: Record<ProjectStatus, string> = {
  SUBMITTED: 'Soumis', UNDER_REVIEW: 'En revue', ACCEPTED: 'Retenu', REJECTED: 'Non retenu',
};

/** Who signed up, built by hand into a CSV: names and emails stay in the admin's browser. */
function downloadCsv(title: string, rows: AdminRegistration[]) {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [['Nom', 'Email', 'Statut', 'Inscrit le'], ...rows.map((row) => [row.name, row.email, ATTENDANCE_LABEL[row.status], row.registeredAt])];
  const blob = new Blob([`\uFEFF${lines.map((line) => line.map(quote).join(';')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `inscrits-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** One sentence above each tab: what it is for and what a click does. */
function Explainer({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 flex gap-2.5 rounded-lg border border-gold-400/25 bg-gold-400/5 p-4 text-sm leading-relaxed text-t2">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden /><span>{children}</span>
    </p>
  );
}

interface RegistrationsProps {
  eventId: number;
  title: string;
  hackathon: boolean;
}

function Registrations({ eventId, title, hackathon }: RegistrationsProps) {
  const list = useApi((signal) => adminApi.eventRegistrations(eventId, signal), [eventId]);
  const [statuses, setStatuses] = useState<Record<number, RegistrationStatus>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [failure, setFailure] = useState('');
  const rows = (list.data ?? []).map((row) => ({ ...row, status: statuses[row.id] ?? row.status }));
  const present = rows.filter((row) => row.status === 'ATTENDED').length;

  // Clicking the active choice again takes the mark back: a mistaken click is never final.
  async function mark(row: AdminRegistration, choice: 'ATTENDED' | 'ABSENT') {
    const status = row.status === choice ? 'REGISTERED' : choice;
    setBusy(row.id);
    setFailure('');
    try {
      await adminApi.markAttendance(row.id, status);
      setStatuses((current) => ({ ...current, [row.id]: status }));
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'Le pointage a échoué.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <Explainer>
        {hackathon
          ? 'Les personnes inscrites au hackathon. Le pointage est facultatif ici : les attestations viennent des projets (onglet Projets).'
          : 'Après l’événement, pointe qui était là. Seules les personnes « Présent » recevront une attestation.'}
        {' '}Un nouveau clic sur le bouton actif annule le pointage.
      </Explainer>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-t3">{rows.filter((row) => row.status !== 'CANCELLED').length} inscrits · {present} présents · {rows.filter((row) => row.status === 'REGISTERED').length} non pointés</p>
        <button type="button" disabled={!rows.length} onClick={() => downloadCsv(title, rows)} className="btn-secondary inline-flex items-center gap-2">
          <Download className="h-4 w-4" aria-hidden />CSV
        </button>
      </div>
      <WriteToRegistrants eventId={eventId} activeCount={rows.filter((row) => row.status !== 'CANCELLED').length} />
      {failure && <p role="alert" className="mb-4 text-sm text-error-ink">{failure}</p>}
      <AdminState loading={list.loading} error={list.error} empty={!rows.length} emptyMessage="Personne n’est encore inscrit." onRetry={list.reload}>
        {rows.map((row) => (
          <AdminRow key={row.id}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-t1">{row.name || row.email}</p>
              <p className="truncate text-xs text-t3">{row.email} · {dateFormat.format(new Date(row.registeredAt))}</p>
            </div>
            {row.status === 'CANCELLED' ? <span className="text-xs text-t4">A annulé son inscription</span> : (
              <div className="flex items-center gap-2" role="group" aria-label={`Présence de ${row.name || row.email}`}>
                {row.status === 'REGISTERED' && <span className="mr-1 text-xs text-t4">Non pointé</span>}
                {(['ATTENDED', 'ABSENT'] as const).map((status) => (
                  <button key={status} type="button" aria-pressed={row.status === status} disabled={busy === row.id} onClick={() => void mark(row, status)}
                    className={`min-h-9 rounded border px-3 text-xs font-medium transition-colors disabled:opacity-50 ${row.status === status
                      ? status === 'ATTENDED' ? 'border-gold-400 bg-gold-400 text-black' : 'border-line bg-noir-800 text-t1'
                      : 'border-line text-t3 hover:text-t1'}`}>
                    {row.status === status ? `${ATTENDANCE_LABEL[status]} ✓` : ATTENDANCE_LABEL[status]}
                  </button>
                ))}
              </div>
            )}
          </AdminRow>
        ))}
      </AdminState>
    </div>
  );
}

interface ProjectReviewCardProps {
  project: AdminProject;
  onSaved: (project: AdminProject) => void;
}

function ProjectReviewCard({ project, onSaved }: ProjectReviewCardProps) {
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [score, setScore] = useState(project.score?.toString() ?? '');
  const [rank, setRank] = useState(project.rank?.toString() ?? '');
  const [note, setNote] = useState(project.reviewNote ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await adminApi.reviewProject(project.id, {
        status, score: score === '' ? null : Number(score), rank: rank === '' ? null : Number(rank), note,
      });
      onSaved(saved);
      setMessage({ ok: true, text: 'Revue enregistrée.' });
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof ApiError ? cause.message : 'L’enregistrement a échoué.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="mb-3 rounded-lg border border-line-soft bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-sans text-base font-semibold tracking-normal text-t1">{project.title}</h3>
          <p className="mt-1 text-xs text-t4">Soumis le {dateFormat.format(new Date(project.submittedAt))}</p>
        </div>
        <span className="shrink-0 rounded border border-line px-2 py-0.5 text-xs text-t2">{PROJECT_LABEL[project.status]}</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {project.team.map((member) => (
          <li key={member.id} className="max-w-full truncate rounded-full bg-noir-800 px-2.5 py-1 text-xs text-t2" title={member.email}>
            {member.name}{member.owner && <span className="text-t4"> · auteur</span>}
          </li>
        ))}
      </ul>
      <p className="mt-3 line-clamp-4 whitespace-pre-line break-words text-sm text-t2">{project.description}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5">Dépôt<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
        {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5">Démo<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-4 sm:grid-cols-3">
        <label className="col-span-2 block text-xs text-t3 sm:col-span-1">Statut
          <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} className="input mt-1.5">
            {(Object.keys(PROJECT_LABEL) as ProjectStatus[]).map((value) => <option key={value} value={value}>{PROJECT_LABEL[value]}</option>)}
          </select>
        </label>
        <label className="block text-xs text-t3">Note / 100
          <input type="number" min={0} max={100} inputMode="numeric" value={score} onChange={(event) => setScore(event.target.value)} className="input mt-1.5" />
        </label>
        <label className="block text-xs text-t3">Classement
          <select value={rank} onChange={(event) => setRank(event.target.value)} className="input mt-1.5">
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => <option key={value} value={value}>{value === 1 ? '1 · lauréat' : value}</option>)}
          </select>
        </label>
        <label className="col-span-2 block text-xs text-t3 sm:col-span-3">Commentaire du jury (reste dans l’admin)
          <textarea rows={2} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} className="input mt-1.5" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => void save()} className="btn-primary">{busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}Enregistrer</button>
        {message && <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-gold-ink' : 'text-error-ink'}`}>{message.text}</p>}
      </div>
    </article>
  );
}

function Projects({ eventId }: { eventId: number }) {
  const list = useApi((signal) => adminApi.eventProjects(eventId, signal), [eventId]);
  const [updated, setUpdated] = useState<Record<number, AdminProject>>({});
  const projects = (list.data ?? []).map((project) => updated[project.id] ?? project);

  return (
    <>
    <Explainer>
      « Soumis » : l’équipe peut encore modifier son projet. « En revue » le verrouille. « Retenu » ouvre droit à une attestation,
      « Non retenu » n’en donne pas. Classement 1 = lauréat, 2 et 3 = podium : une attestation et un badge en plus.
      Rien n’est envoyé aux équipes tant que tu n’émets pas les attestations.
    </Explainer>
    <AdminState loading={list.loading} error={list.error} empty={!projects.length} emptyMessage="Aucun projet soumis pour l’instant." onRetry={list.reload}>
      {projects.map((project) => (
        <ProjectReviewCard key={project.id} project={project} onSaved={(saved) => setUpdated((current) => ({ ...current, [saved.id]: saved }))} />
      ))}
    </AdminState>
    </>
  );
}

/** One event's people: who signed up and was there, and the projects to review. */
export default function AdminEventParticipants() {
  const { id = '' } = useParams();
  const eventId = Number(id);
  const event = useApi((signal) => api.event(eventId, signal), [eventId]);
  const [tab, setTab] = useState<'registrations' | 'projects' | 'certificates'>('registrations');
  const title = event.data?.title ?? 'Événement';

  return (
    <AdminSection title={title} description="Inscrits, présence, projets et attestations de cet événement."
      action={<Link to="/admin/evenements" className="btn-secondary inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4" aria-hidden />Événements</Link>}>
      <AdminState loading={event.loading} error={event.error} empty={false} emptyMessage="" onRetry={event.reload}>
        <ol className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            ['Inscrits', event.data?.acceptsSubmissions ? 'Qui participe. Rien à faire, sauf exporter la liste.' : 'Après l’événement, pointe qui était présent.'],
            ...(event.data?.acceptsSubmissions ? [['Projets', 'Évalue chaque projet : statut, note, classement.']] : []),
            ['Attestations', 'Prépare les brouillons, vérifie-les, puis émets : chacun reçoit un email.'],
          ].map(([step, text], index) => (
            <li key={step} className="rounded-lg border border-line-soft bg-card p-4">
              <p className="text-sm font-semibold text-t1"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-black">{index + 1}</span>{step}</p>
              <p className="mt-2 text-xs leading-relaxed text-t3">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mb-5">
          <Segmented label="Vue">
            {([
              ['registrations', 'Inscrits'],
              ...(event.data?.acceptsSubmissions ? [['projects', 'Projets']] : []),
              ['certificates', 'Attestations'],
            ] as Array<[typeof tab, string]>).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}
                className={`${SEGMENT} ${tab === value ? 'bg-gold-400 text-black' : 'text-t3 hover:text-t1'}`}>{label}</button>
            ))}
          </Segmented>
        </div>
        {tab === 'projects' && event.data?.acceptsSubmissions ? <Projects eventId={eventId} />
          : tab === 'certificates' ? <EventCertificates eventId={eventId} acceptsSubmissions={Boolean(event.data?.acceptsSubmissions)} />
            : <Registrations eventId={eventId} title={title} hackathon={Boolean(event.data?.acceptsSubmissions)} />}
      </AdminState>
    </AdminSection>
  );
}
