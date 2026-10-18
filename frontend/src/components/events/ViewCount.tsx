import { Eye } from 'lucide-react';

interface ViewCountProps {
  count: number;
  /** The full sentence, for the event page; cards show the eye and the figure only. */
  spelledOut?: boolean;
  className?: string;
}

/** How many different people opened the event. Nothing at zero: an empty figure tells nobody anything. */
export default function ViewCount({ count, spelledOut = false, className = '' }: ViewCountProps) {
  if (count < 1) return null;
  const figure = count.toLocaleString('fr-FR');
  const sentence = `${figure} ${count > 1 ? 'personnes ont' : 'personne a'} consulté cet événement`;
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${className}`} title={sentence}>
      <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {spelledOut ? sentence : <>{figure}<span className="sr-only"> {sentence.slice(figure.length + 1)}</span></>}
    </span>
  );
}
