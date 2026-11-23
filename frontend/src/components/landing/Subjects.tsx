import { Binary, Boxes, Brain, Cloud, FlaskConical, GitMerge, Hexagon, Infinity as InfinityIcon, Network, Plug, Shapes, ShieldCheck, type LucideIcon } from 'lucide-react';

import Marquee from '@/components/landing/Marquee';
import { Reveal } from '@/components/landing/motion';
import { TOOL_ICONS } from '@/components/landing/toolIcons';

type Subject = { name: string; tool: keyof typeof TOOL_ICONS } | { name: string; icon: LucideIcon };

// Tools carry their logo, concepts an icon; each row mixes the two so neither reads as the point.
const FIRST_ROW: Subject[] = [
  { name: 'Java', tool: 'java' }, { name: 'Microservices', icon: Boxes }, { name: 'Spring Boot', tool: 'springBoot' },
  { name: 'Cloud', icon: Cloud }, { name: 'Python', tool: 'python' }, { name: 'API REST', icon: Plug },
  { name: 'TypeScript', tool: 'typescript' }, { name: 'DevOps', icon: InfinityIcon }, { name: 'React', tool: 'react' },
  { name: 'Sécurité', icon: ShieldCheck }, { name: 'Go', tool: 'go' }, { name: 'IA et data', icon: Brain },
];

const SECOND_ROW: Subject[] = [
  { name: 'Docker', tool: 'docker' }, { name: 'Architecture hexagonale', icon: Hexagon }, { name: 'Kubernetes', tool: 'kubernetes' },
  { name: 'Systèmes distribués', icon: Network }, { name: 'PostgreSQL', tool: 'postgresql' }, { name: 'CI/CD', icon: GitMerge },
  { name: 'Linux', tool: 'linux' }, { name: 'Algorithmes', icon: Binary }, { name: 'Git', tool: 'git' },
  { name: 'Design patterns', icon: Shapes }, { name: 'Kotlin', tool: 'kotlin' }, { name: 'Tests', icon: FlaskConical },
  { name: 'Flutter', tool: 'flutter' },
];

function SubjectItem({ subject }: { subject: Subject }) {
  return (
    <span className="mx-6 inline-flex shrink-0 items-center gap-4 sm:mx-10">
      {'tool' in subject ? (
        <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 fill-white/80 sm:h-9 sm:w-9"><path d={TOOL_ICONS[subject.tool]} /></svg>
      ) : (
        <subject.icon className="h-7 w-7 shrink-0 text-gold-400 sm:h-9 sm:w-9" strokeWidth={1.5} />
      )}
      <span className={`whitespace-nowrap text-2xl font-medium tracking-[-0.03em] sm:text-4xl ${'tool' in subject ? 'text-white' : 'text-white/45'}`}>{subject.name}</span>
    </span>
  );
}

/** What LesCracks writes and talks about, as two rows drifting in opposite directions. */
export default function Subjects() {
  return (
    <section aria-labelledby="subjects-title" className="border-y border-white/[0.06] py-16 sm:py-20">
      <Reveal className="mx-auto flex max-w-[1320px] flex-col gap-2 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <p className="text-sm font-medium text-gold-400">Les sujets</p>
        <h2 id="subjects-title" className="max-w-lg text-base font-normal leading-normal tracking-normal text-white/50 sm:text-right">
          Des langages et des outils, mais surtout les concepts qui tiennent dans la durée.
        </h2>
      </Reveal>
      <div className="mt-10 space-y-5 sm:mt-14">
        <Marquee speed={0.55}>{FIRST_ROW.map((subject) => <SubjectItem key={subject.name} subject={subject} />)}</Marquee>
        <Marquee speed={-0.45}>{SECOND_ROW.map((subject) => <SubjectItem key={subject.name} subject={subject} />)}</Marquee>
      </div>
      <p className="sr-only">{[...FIRST_ROW, ...SECOND_ROW].map((subject) => subject.name).join(', ')}.</p>
    </section>
  );
}
