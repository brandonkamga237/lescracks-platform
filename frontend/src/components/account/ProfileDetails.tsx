import { useEffect, useState, type ReactNode } from 'react';

import EditableSection from '@/components/account/EditableSection';
import PhoneField from '@/components/account/PhoneField';
import { useApi } from '@/hooks/useApi';
import { GOAL_LABEL, SITUATION_LABEL } from '@/lib/memberProfile';
import { countryName, displayPhone } from '@/lib/phone';
import { api } from '@/services/api';
import type { MemberGoal, MemberSituation, UserProfile } from '@/services/types';

interface ProfileDetailsProps {
  user: UserProfile;
  /** Reloads the session once a section is saved. */
  onSaved: () => Promise<void>;
}

interface RowsProps {
  rows: [string, ReactNode | null][];
}

function Rows({ rows }: RowsProps) {
  return (
    <dl className="divide-y divide-line-soft border-y border-line-soft text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="shrink-0 text-t4">{label}</dt>
          <dd className={`min-w-0 break-words text-right ${value ? 'text-t1' : 'text-t4'}`}>{value ?? 'À compléter'}</dd>
        </div>
      ))}
    </dl>
  );
}

const providerLabels = { LOCAL: 'Email et mot de passe', GOOGLE: 'Google', GITHUB: 'GitHub' };

/** The member's profile as four short sections, each edited and saved on its own. */
export default function ProfileDetails({ user, onSaved }: ProfileDetailsProps) {
  const categories = useApi((signal) => api.categories(signal), []);
  const categoryName = (id: number) => categories.data?.find((category) => category.id === id)?.name;

  const [identity, setIdentity] = useState({ firstName: '', lastName: '', username: '' });
  const [about, setAbout] = useState<{ situation?: MemberSituation; goal?: MemberGoal; location: string; bio: string; interestIds: number[] }>({ location: '', bio: '', interestIds: [] });
  // '' when empty, null while what is typed is not a valid number yet.
  const [phone, setPhone] = useState<string | null>('');
  const [consent, setConsent] = useState(false);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [newLink, setNewLink] = useState({ platform: '', url: '' });

  function reset() {
    setIdentity({ firstName: user.firstName, lastName: user.lastName, username: user.username ?? '' });
    setAbout({ situation: user.situation, goal: user.goal, location: user.location ?? '', bio: user.bio ?? '', interestIds: user.interestIds });
    setPhone(user.phone ?? '');
    setConsent(user.marketingConsent);
    setLinks(user.socialLinks ?? {});
    setNewLink({ platform: '', url: '' });
  }
  // Every section starts from what is saved, and goes back to it when the session reloads.
  useEffect(reset, [user]);

  async function save(changes: Parameters<typeof api.updateProfile>[0]) {
    await api.updateProfile(changes);
    await onSaved();
  }

  const joined = new Date(user.createdAt);
  const city = user.location ? `${user.location}${user.country ? `, ${countryName(user.country)}` : ''}` : user.country ? countryName(user.country) : null;

  return (
    <div className="space-y-6">
      <EditableSection id="informations" title="Identité" description="Ton nom tel qu’il apparaît sur LesCracks."
        onCancel={reset}
        onSave={() => {
          if (!identity.firstName.trim() || !identity.lastName.trim()) throw new Error('Renseigne ton prénom et ton nom.');
          return save({ firstName: identity.firstName.trim(), lastName: identity.lastName.trim(), username: identity.username.trim() });
        }}
        view={<Rows rows={[
          ['Nom', `${user.firstName} ${user.lastName}`.trim() || null],
          ['Nom d’utilisateur', user.username || null],
          ['Email', user.email],
          ['Connexion', providerLabels[user.provider] ?? user.provider],
          ['Membre depuis', Number.isNaN(joined.getTime()) ? null : joined.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })],
        ]} />}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="profile-firstName" className="text-sm font-medium text-t2">Prénom</label>
            <input id="profile-firstName" autoComplete="given-name" required value={identity.firstName} onChange={(event) => setIdentity({ ...identity, firstName: event.target.value })} className="input mt-2" /></div>
          <div><label htmlFor="profile-lastName" className="text-sm font-medium text-t2">Nom</label>
            <input id="profile-lastName" autoComplete="family-name" required value={identity.lastName} onChange={(event) => setIdentity({ ...identity, lastName: event.target.value })} className="input mt-2" /></div>
        </div>
        <div><label htmlFor="profile-username" className="text-sm font-medium text-t2">Nom d’utilisateur <span className="font-normal text-t4">(facultatif)</span></label>
          <input id="profile-username" value={identity.username} onChange={(event) => setIdentity({ ...identity, username: event.target.value })} className="input mt-2" /></div>
        <p className="text-xs text-t4">Ton adresse email ne peut pas être modifiée ici.</p>
      </EditableSection>

      <EditableSection id="a-propos" title="À propos de toi" description="Pour te proposer les bonnes ressources et les bons ateliers."
        onCancel={reset}
        onSave={() => save({ situation: about.situation, goal: about.goal, location: about.location.trim(), bio: about.bio.trim(), interestIds: about.interestIds })}
        view={<>
          <Rows rows={[
            ['Situation', user.situation ? SITUATION_LABEL[user.situation] : null],
            ['Objectif', user.goal ? GOAL_LABEL[user.goal] : null],
            ['Ville', city],
          ]} />
          {user.interestIds.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{user.interestIds.map((id) => categoryName(id) &&
            <span key={id} className="rounded border border-line px-2 py-0.5 text-xs text-t2">{categoryName(id)}</span>)}</div>}
          {user.bio && <p className="mt-4 whitespace-pre-line text-sm text-t2">{user.bio}</p>}
        </>}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="profile-situation" className="text-sm font-medium text-t2">Situation</label>
            <select id="profile-situation" value={about.situation ?? ''} onChange={(event) => setAbout({ ...about, situation: (event.target.value || undefined) as MemberSituation | undefined })} className="input mt-2">
              <option value="">Choisir</option>{(Object.entries(SITUATION_LABEL) as [MemberSituation, string][]).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select></div>
          <div><label htmlFor="profile-goal" className="text-sm font-medium text-t2">Objectif</label>
            <select id="profile-goal" value={about.goal ?? ''} onChange={(event) => setAbout({ ...about, goal: (event.target.value || undefined) as MemberGoal | undefined })} className="input mt-2">
              <option value="">Choisir</option>{(Object.entries(GOAL_LABEL) as [MemberGoal, string][]).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select></div>
        </div>
        <div><label htmlFor="profile-location" className="text-sm font-medium text-t2">Ville</label>
          <input id="profile-location" autoComplete="address-level2" value={about.location} onChange={(event) => setAbout({ ...about, location: event.target.value })} className="input mt-2" /></div>
        <div>
          <span className="text-sm font-medium text-t2">Centres d’intérêt <span className="font-normal text-t4">(10 au plus)</span></span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Centres d’intérêt">
            {categories.data?.map((category) => {
              const on = about.interestIds.includes(category.id);
              return <button key={category.id} type="button" aria-pressed={on} disabled={!on && about.interestIds.length >= 10}
                onClick={() => setAbout({ ...about, interestIds: on ? about.interestIds.filter((id) => id !== category.id) : [...about.interestIds, category.id] })}
                className={`min-h-9 rounded border px-3 text-sm transition-colors disabled:opacity-40 ${on ? 'border-gold-400 bg-gold-400/10 text-t1' : 'border-line text-t3 hover:text-t1'}`}>{category.name}</button>;
            })}
          </div>
        </div>
        <div><label htmlFor="profile-bio" className="text-sm font-medium text-t2">Quelques mots sur toi</label>
          <textarea id="profile-bio" rows={3} maxLength={2000} value={about.bio} onChange={(event) => setAbout({ ...about, bio: event.target.value })} className="input mt-2" /></div>
      </EditableSection>

      <EditableSection id="contact" title="Téléphone" description="Jamais affiché publiquement."
        onCancel={reset}
        onSave={() => {
          if (phone === null) throw new Error('Ce numéro ne correspond pas au pays choisi. Corrige-le ou vide le champ.');
          return save({ phone, marketingConsent: consent });
        }}
        view={<Rows rows={[
          ['Numéro', user.phone ? displayPhone(user.phone) : null],
          ['Nouveautés par WhatsApp ou SMS', user.marketingConsent ? 'Oui' : 'Non'],
        ]} />}>
        <PhoneField value={phone ?? ''} onChange={setPhone} hint="Le pays de ton compte est déduit de l’indicatif." />
        <label className="flex items-start gap-3 text-sm text-t3">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4af37]" />
          <span>Recevoir les nouveautés par WhatsApp ou SMS.</span>
        </label>
      </EditableSection>

      <EditableSection id="liens" title="Liens" description="LinkedIn, GitHub, portfolio…"
        onCancel={reset}
        onSave={() => {
          const all = newLink.platform.trim() && newLink.url.trim() ? { ...links, [newLink.platform.trim().toLowerCase()]: newLink.url.trim() } : links;
          return save({ socialLinks: all });
        }}
        view={user.socialLinks && Object.keys(user.socialLinks).length > 0
          ? <ul className="space-y-2 text-sm">{Object.entries(user.socialLinks).map(([platform, url]) => (
            <li key={platform} className="flex items-baseline justify-between gap-4"><span className="capitalize text-t4">{platform}</span>
              <a href={url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-gold-ink underline-offset-4 hover:underline">{url.replace(/^https?:\/\//, '')}</a></li>))}</ul>
          : <p className="text-sm text-t4">Aucun lien pour l’instant.</p>}>
        {Object.entries(links).map(([platform, url]) => (
          <div key={platform} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-sm capitalize text-t2">{platform}</span>
            <input type="url" aria-label={`Lien ${platform}`} value={url} onChange={(event) => setLinks({ ...links, [platform]: event.target.value })} className="input" />
            <button type="button" onClick={() => { const next = { ...links }; delete next[platform]; setLinks(next); }} className="shrink-0 text-sm text-error-ink">Retirer</button>
          </div>
        ))}
        <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
          <input value={newLink.platform} onChange={(event) => setNewLink({ ...newLink, platform: event.target.value })} className="input" placeholder="LinkedIn" aria-label="Nom du site" />
          <input type="url" value={newLink.url} onChange={(event) => setNewLink({ ...newLink, url: event.target.value })} className="input" placeholder="https://…" aria-label="Adresse du lien" />
        </div>
      </EditableSection>
    </div>
  );
}
