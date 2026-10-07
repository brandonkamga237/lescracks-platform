import type { ArticleBlock } from '@/services/types';

export interface ArticleCheck {
  /** `blocking` prevents saving (the backend would refuse it); `advice` never does. */
  level: 'blocking' | 'advice';
  message: string;
}

interface ArticleDraft {
  title: string;
  description: string;
  categoryId: number | '';
  hasCover: boolean;
  blocks: ArticleBlock[];
  words: number;
}

const LONG_PARAGRAPH_WORDS = 140;

export function checkArticle({ title, description, categoryId, hasCover, blocks, words }: ArticleDraft): ArticleCheck[] {
  const checks: ArticleCheck[] = [];
  const blocking = (message: string) => checks.push({ level: 'blocking', message });
  const advice = (message: string) => checks.push({ level: 'advice', message });

  if (!title.trim()) blocking('Donne un titre à l’article.');
  if (!description.trim()) blocking('Écris le chapô : deux ou trois phrases qui donnent envie de lire.');
  if (!categoryId) blocking('Choisis une catégorie dans les réglages.');
  if (!hasCover) blocking('Ajoute une image de couverture dans les réglages.');
  if (!blocks.length) blocking('Le corps de l’article est vide.');

  if (title.trim().length > 90) advice('Le titre dépasse 90 caractères : il sera coupé dans les partages.');
  if (description.trim() && description.trim().length < 80) advice('Le chapô est très court : il sert aussi de résumé dans la bibliothèque et les partages.');
  if (blocks.length && words < 300) advice(`L’article fait ${words} mots : vise au moins 300 pour un contenu qui apporte vraiment quelque chose.`);

  const headings = blocks.filter((block) => block.type === 'heading');
  if (words > 600 && headings.length === 0) advice('Plus de 600 mots sans intertitre : découpe le texte en sections avec ##.');
  const firstH3 = blocks.findIndex((block) => block.type === 'heading' && block.level === 3);
  const firstH2 = blocks.findIndex((block) => block.type === 'heading' && block.level === 2);
  if (firstH3 !== -1 && (firstH2 === -1 || firstH3 < firstH2)) advice('Un sous-titre (###) apparaît avant toute section (##) : la hiérarchie sera confuse pour les lecteurs d’écran.');

  blocks.forEach((block, index) => {
    if (block.type === 'image' && !block.alt?.trim()) advice(`Image ${index + 1} sans texte alternatif : décris-la entre les crochets ![…].`);
    if (block.type === 'paragraph' && block.text.split(/\s+/).length > LONG_PARAGRAPH_WORDS) advice(`Un paragraphe dépasse ${LONG_PARAGRAPH_WORDS} mots : coupe-le pour garder le rythme.`);
    if (block.type === 'heading' && blocks[index + 1]?.type === 'heading') advice(`« ${block.text} » est suivi directement d’un autre titre.`);
    if (block.type === 'code' && !block.language) advice('Un bloc de code n’indique pas son langage (```bash, ```js…).');
  });

  return checks;
}
