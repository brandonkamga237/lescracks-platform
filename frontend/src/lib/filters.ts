/** Page size of the public lists: below it, everything already fits on one screen of results. */
export const LIST_PAGE_SIZE = 12;

/**
 * A filter only earns its row once the list no longer fits on one page. An active filter
 * stays visible whatever the count, otherwise a shared filtered link could not be cleared.
 */
export function worthFiltering(total: number, active: boolean): boolean {
  return active || total > LIST_PAGE_SIZE;
}
