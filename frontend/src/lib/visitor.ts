const KEY = 'lc-visitor-id';
let fallback: string | null = null;

/**
 * A random id this browser keeps, so an anonymous visitor opening an event twice counts once.
 * It identifies a browser, never a person; blocked storage gets an id for this page load only.
 */
export function browserVisitorId(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    const created = crypto.randomUUID();
    localStorage.setItem(KEY, created);
    return created;
  } catch {
    fallback ??= crypto.randomUUID();
    return fallback;
  }
}
