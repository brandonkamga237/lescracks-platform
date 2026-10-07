import type { ArticleBlock, CalloutTone } from '@/services/types';

/**
 * Markdown is how the studio is written; blocks are how articles are stored and rendered.
 * Inline marks (**bold**, *italic*, `code`, [label](url)) are already Markdown inside a
 * block's text, so only the block structure is converted here.
 */

const TONE_TO_MARK: Record<CalloutTone, string> = { tip: 'TIP', note: 'NOTE', warning: 'WARNING' };
const MARK_TO_TONE: Record<string, CalloutTone> = {
  TIP: 'tip', ASTUCE: 'tip',
  NOTE: 'note', IMPORTANT: 'note', RETENIR: 'note',
  WARNING: 'warning', CAUTION: 'warning', ATTENTION: 'warning',
};

const FENCE = /^```\s*([\w+#.-]*)\s*$/;
const HEADING = /^(#{1,3})\s+(.+)$/;
const RULE = /^(-{3,}|\*{3,}|_{3,})$/;
const IMAGE = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;
const LINK_ONLY = /^\[([^\]]+)\]\((\S+?)\)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const CALLOUT = /^\[!([A-Za-zÀ-ÿ]+)\]\s*(.*)$/;

function startsBlock(line: string): boolean {
  const trimmed = line.trim();
  return FENCE.test(trimmed) || HEADING.test(trimmed) || RULE.test(trimmed) || IMAGE.test(trimmed)
    || trimmed.startsWith('>') || BULLET.test(line) || NUMBERED.test(line);
}

const joinLines = (lines: string[]) => lines.map((line) => line.trim()).filter(Boolean).join(' ');

export function markdownToBlocks(markdown: string): ArticleBlock[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ArticleBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i += 1; continue; }

    const fence = trimmed.match(FENCE);
    if (fence) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) { body.push(lines[i]); i += 1; }
      i += 1;
      blocks.push(fence[1] ? { type: 'code', language: fence[1], text: body.join('\n') } : { type: 'code', text: body.join('\n') });
      continue;
    }

    const heading = trimmed.match(HEADING);
    if (heading) {
      // A single # is the article title's level; inside the body it becomes a section.
      blocks.push({ type: 'heading', level: heading[1].length === 3 ? 3 : 2, text: heading[2].trim() });
      i += 1;
      continue;
    }

    if (RULE.test(trimmed)) { blocks.push({ type: 'divider' }); i += 1; continue; }

    const image = trimmed.match(IMAGE);
    if (image) {
      blocks.push({ type: 'image', url: image[2], ...(image[1] ? { alt: image[1] } : {}), ...(image[3] ? { caption: image[3] } : {}) });
      i += 1;
      continue;
    }

    const link = trimmed.match(LINK_ONLY);
    if (link) { blocks.push({ type: 'link', text: link[1], url: link[2] }); i += 1; continue; }

    if (trimmed.startsWith('>')) {
      const body: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { body.push(lines[i].trim().replace(/^>\s?/, '')); i += 1; }
      const callout = body[0]?.match(CALLOUT);
      const tone = callout ? MARK_TO_TONE[callout[1].toUpperCase()] : undefined;
      if (callout && tone) blocks.push({ type: 'callout', tone, text: joinLines([callout[2], ...body.slice(1)]) });
      else blocks.push({ type: 'quote', text: joinLines(body) });
      continue;
    }

    if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = NUMBERED.test(line);
      const marker = ordered ? NUMBERED : BULLET;
      const items: { text: string }[] = [];
      while (i < lines.length) {
        const item = lines[i].match(marker);
        if (item) { items.push({ text: item[1].trim() }); i += 1; continue; }
        // An indented line continues the previous item instead of ending the list.
        if (items.length && lines[i].trim() && /^\s{2,}/.test(lines[i])) { items[items.length - 1].text += ` ${lines[i].trim()}`; i += 1; continue; }
        break;
      }
      blocks.push(ordered ? { type: 'list', ordered: true, items } : { type: 'list', items });
      continue;
    }

    const body: string[] = [];
    while (i < lines.length && lines[i].trim() && (body.length === 0 || !startsBlock(lines[i]))) { body.push(lines[i]); i += 1; }
    blocks.push({ type: 'paragraph', text: joinLines(body) });
  }

  return blocks;
}

export function blocksToMarkdown(blocks: ArticleBlock[]): string {
  return blocks.map((block) => {
    switch (block.type) {
      case 'heading': return `${'#'.repeat(block.level)} ${block.text}`;
      case 'quote': return `> ${block.text}`;
      case 'callout': return `> [!${TONE_TO_MARK[block.tone]}]\n> ${block.text}`;
      case 'list': return block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : '-'} ${item.text}`).join('\n');
      case 'code': return `\`\`\`${block.language ?? ''}\n${block.text}\n\`\`\``;
      case 'image': return `![${block.alt ?? ''}](${block.url}${block.caption ? ` "${block.caption.replace(/"/g, '’')}"` : ''})`;
      case 'link': return `[${block.text || block.url}](${block.url})`;
      case 'divider': return '---';
      default: return block.text;
    }
  }).join('\n\n');
}

/** Anchor for a heading, shared by the outline and the rendered article. */
export function headingId(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[*`[\]()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}

/** The same count the backend derives on save (text, caption and alt, 200 words a minute). */
export function articleStats(blocks: ArticleBlock[]) {
  const prose: string[] = [];
  blocks.forEach((block) => {
    if ('text' in block && block.text) prose.push(block.text);
    if (block.type === 'list') block.items.forEach((item) => prose.push(item.text));
    if (block.type === 'image') prose.push(block.alt ?? '', block.caption ?? '');
  });
  const words = prose.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.ceil(words / 200)) };
}
