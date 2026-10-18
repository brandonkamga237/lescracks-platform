/**
 * Markdown reduced to the sentence a card excerpt or a meta description shows: headings, block markers,
 * emphasis and link targets go, the words stay. Underscores are left alone, they live in code names.
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    // A section title glued to the next sentence reads as one garbled phrase in a three-line excerpt.
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(>|[-*+]|\d+[.)])\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\s][^*]*)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
