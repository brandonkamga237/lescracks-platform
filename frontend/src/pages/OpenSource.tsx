// src/pages/OpenSource.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Github, Linkedin, Globe, Twitter, Star, GitFork, ExternalLink, Users, Code2, Loader2 } from 'lucide-react';
import { ENV } from '@/config/env';

const API_BASE = ENV.API_BASE_URL;

interface OpenSourceProject {
  id: number;
  name: string;
  description: string;
  repoUrl: string;
  language: string;
  logoUrl?: string;
  techStack?: string;
  stars: number;
  forks: number;
  featured: boolean;
}

interface Contributor {
  id: number;
  name: string;
  description?: string;
  photoUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  contributedProjects?: string[];
}

const LANG_COLORS: Record<string, string> = {
  Java: 'bg-orange-100 text-orange-700',
  Python: 'bg-blue-100 text-blue-700',
  JavaScript: 'bg-yellow-100 text-yellow-700',
  TypeScript: 'bg-blue-100 text-blue-800',
  Go: 'bg-cyan-100 text-cyan-700',
  Rust: 'bg-red-100 text-red-700',
  React: 'bg-sky-100 text-sky-700',
  default: 'bg-gray-100 text-gray-700',
};

const langColor = (lang?: string) =>
  lang ? (LANG_COLORS[lang] ?? LANG_COLORS.default) : LANG_COLORS.default;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (json.success && json.data !== undefined) return json.data as T;
  return json as T;
}

const OpenSource = () => {
  const [projects, setProjects] = useState<OpenSourceProject[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingContributors, setLoadingContributors] = useState(true);

  useEffect(() => {
    fetchJson<OpenSourceProject[]>(`${API_BASE}/open-source/projects`)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));

    fetchJson<Contributor[]>(`${API_BASE}/open-source/contributors`)
      .then(setContributors)
      .catch(() => setContributors([]))
      .finally(() => setLoadingContributors(false));
  }, []);

  return (
    <Layout>
      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-sm font-medium mb-6">
              <Code2 className="w-4 h-4" />
              Open Source
            </span>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
              Nous construisons en{' '}
              <span className="text-gold">open source</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              LesCracks contribue à l'écosystème open source africain. Nos outils, nos librairies,
              nos projets — disponibles pour tous.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-8 mt-12"
          >
            {[
              { label: 'Projets', value: projects.length || '—' },
              { label: 'Contributeurs reconnus', value: contributors.length || '—' },
              { label: 'Étoiles cumulées', value: projects.reduce((s, p) => s + p.stars, 0) || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold text-gold">{value}</p>
                <p className="text-sm text-zinc-500 mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section id="projects" className="py-20 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-white mb-3">
              Nos projets
            </h2>
            <p className="text-zinc-400">Des outils que nous créons et maintenons pour la communauté.</p>
          </motion.div>

          {loadingProjects ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <Code2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun projet pour l'instant — bientôt disponible.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, i) => (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-gold/30 transition-colors group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {project.logoUrl ? (
                        <img src={project.logoUrl} alt={project.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                          <Code2 className="w-5 h-5 text-gold" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-gold transition-colors">
                          {project.name}
                        </h3>
                        {project.language && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${langColor(project.language)}`}>
                            {project.language}
                          </span>
                        )}
                      </div>
                    </div>
                    {project.featured && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold border border-gold/20 font-medium">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed flex-1 mb-4">
                    {project.description || 'Pas de description.'}
                  </p>

                  {project.techStack && (
                    <p className="text-xs text-zinc-500 mb-4">{project.techStack}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />{project.stars}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3.5 h-3.5" />{project.forks}
                      </span>
                    </div>
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-gold hover:text-gold/80 transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        Voir le repo
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Contributors ── */}
      <section id="contributors" className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-white mb-3 flex items-center gap-3">
              <Users className="w-7 h-7 text-gold" />
              Contributeurs reconnus
            </h2>
            <p className="text-zinc-400">
              Les développeurs qui ont contribué à nos projets open source.
            </p>
          </motion.div>

          {loadingContributors ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : contributors.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun contributeur enregistré pour l'instant.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {contributors.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-gold/30 transition-colors text-center group"
                >
                  {c.photoUrl ? (
                    <img
                      src={c.photoUrl}
                      alt={c.name}
                      className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-zinc-700 group-hover:ring-gold/40 transition-all"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4 ring-2 ring-zinc-700">
                      <span className="text-2xl font-bold text-gold">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <h3 className="font-semibold text-white mb-1">{c.name}</h3>

                  {c.description && (
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-3">
                      {c.description}
                    </p>
                  )}

                  {c.contributedProjects && c.contributedProjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                      {c.contributedProjects.slice(0, 3).map(proj => (
                        <span key={proj} className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                          {proj}
                        </span>
                      ))}
                      {c.contributedProjects.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                          +{c.contributedProjects.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3">
                    {c.githubUrl && (
                      <a href={c.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {c.linkedinUrl && (
                      <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-zinc-400 hover:text-blue-400 transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {c.twitterUrl && (
                      <a href={c.twitterUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-zinc-400 hover:text-sky-400 transition-colors">
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {c.websiteUrl && (
                      <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-zinc-400 hover:text-gold transition-colors">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Tu veux contribuer ?
            </h2>
            <p className="text-zinc-400 mb-8">
              Rejoins notre communauté, contribue à nos projets open source et fais partie des
              contributeurs reconnus par LesCracks.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-black font-semibold rounded-xl hover:bg-gold/90 transition-colors"
            >
              <Github className="w-5 h-5" />
              Voir nos repos GitHub
            </a>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default OpenSource;
