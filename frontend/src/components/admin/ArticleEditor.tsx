import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';

type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'quote'; text: string }
  | { type: 'image'; url: string; alt: string; caption: string }
  | { type: 'link'; url: string; text: string }
  | { type: 'divider' };

interface ArticleEditorProps {
  value?: unknown[];
  onChange: (blocks: unknown[]) => void;
}

function isArticleBlock(candidate: unknown): candidate is ArticleBlock {
  return typeof candidate === 'object' && candidate !== null && 'type' in (candidate as Record<string, unknown>);
}

const TYPE_LABELS: Record<string, string> = {
  paragraph: 'Paragraphe',
  heading: 'Titre',
  quote: 'Citation',
  image: 'Image',
  link: 'Lien',
  divider: 'Séparateur',
};

export default function ArticleEditor({ value, onChange }: ArticleEditorProps) {
  const [blocks, setBlocks] = useState<ArticleBlock[]>(() =>
    Array.isArray(value) ? value.filter(isArticleBlock) as ArticleBlock[] : []
  );

  useEffect(() => {
    if (Array.isArray(value)) {
      const next = value.filter(isArticleBlock) as ArticleBlock[];
      if (JSON.stringify(next) !== JSON.stringify(blocks)) {
        setBlocks(next);
      }
    }
  }, [value, blocks]);

  function pushChange(next: ArticleBlock[]) {
    setBlocks(next);
    onChange(next as unknown[]);
  }

  function update(index: number, block: ArticleBlock) {
    const next = [...blocks];
    next[index] = block;
    pushChange(next);
  }

  function updateType(index: number, type: string) {
    const next = [...blocks];
    const existingText = ('text' in next[index] ? (next[index] as { text: string }).text : '') || '';
    if (type === 'paragraph') next[index] = { type: 'paragraph', text: existingText };
    else if (type === 'heading') next[index] = { type: 'heading', level: 2, text: existingText };
    else if (type === 'quote') next[index] = { type: 'quote', text: existingText };
    else if (type === 'image') next[index] = { type: 'image', url: '', alt: '', caption: '' };
    else if (type === 'link') next[index] = { type: 'link', url: '', text: existingText };
    else if (type === 'divider') next[index] = { type: 'divider' };
    else next[index] = { type: 'paragraph', text: existingText };
    pushChange(next);
  }

  function addBlock() {
    pushChange([...blocks, { type: 'paragraph', text: '' }]);
  }

  function removeBlock(index: number) {
    const next = [...blocks];
    next.splice(index, 1);
    pushChange(next);
  }

  function move(index: number, direction: number) {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === blocks.length - 1) return;
    const next = [...blocks];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    pushChange(next);
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div key={index} className="rounded-2xl border border-line p-4">
          <div className="mb-3 flex items-center gap-2">
            <select
              value={block.type}
              onChange={(event) => updateType(index, event.target.value)}
              className="rounded-lg border border-line bg-noir-900 px-2 py-1 text-sm text-t1"
            >
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded p-1 text-t3 hover:text-t1 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === blocks.length - 1} className="rounded p-1 text-t3 hover:text-t1 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => removeBlock(index)} className="ml-auto rounded p-1 text-t3 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
          </div>

          {block.type === 'paragraph' && (
            <textarea
              value={block.text}
              onChange={(event) => update(index, { ...block, text: event.target.value })}
              rows={4}
              placeholder="Écris un paragraphe..."
              className="input h-auto w-full"
            />
          )}

          {block.type === 'heading' && (
            <div className="flex gap-3">
              <select
                value={block.level}
                onChange={(event) => update(index, { ...block, level: Number(event.target.value) as 2 | 3 })}
                className="w-20 rounded-lg border border-line bg-noir-900 px-2 py-2 text-sm text-t1"
              >
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
              <input
                value={block.text}
                onChange={(event) => update(index, { ...block, text: event.target.value })}
                placeholder="Titre de section"
                className="input flex-1"
              />
            </div>
          )}

          {block.type === 'quote' && (
            <textarea
              value={block.text}
              onChange={(event) => update(index, { ...block, text: event.target.value })}
              rows={3}
              placeholder="Une citation ou un encadré..."
              className="input h-auto w-full border-l-4 border-gold-400"
            />
          )}

          {block.type === 'image' && (
            <div className="space-y-3">
              <input
                value={block.url}
                onChange={(event) => update(index, { ...block, url: event.target.value })}
                placeholder="URL de l'image"
                className="input w-full"
              />
              <input
                value={block.alt}
                onChange={(event) => update(index, { ...block, alt: event.target.value })}
                placeholder="Texte alternatif"
                className="input w-full"
              />
              <input
                value={block.caption}
                onChange={(event) => update(index, { ...block, caption: event.target.value })}
                placeholder="Légende"
                className="input w-full"
              />
            </div>
          )}

          {block.type === 'link' && (
            <div className="flex gap-3">
              <input
                value={block.url}
                onChange={(event) => update(index, { ...block, url: event.target.value })}
                placeholder="https://..."
                className="input flex-1"
              />
              <input
                value={block.text}
                onChange={(event) => update(index, { ...block, text: event.target.value })}
                placeholder="Texte du lien"
                className="input flex-1"
              />
            </div>
          )}

          {block.type === 'divider' && (
            <hr className="border-line" />
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addBlock}
        className="inline-flex items-center gap-2 rounded-xl border border-gold-400/30 px-4 py-2 text-sm font-medium text-gold-400 transition-colors hover:bg-gold-400/10"
      >
        <Plus className="h-4 w-4" />
        Ajouter un bloc
      </button>
    </div>
  );
}
