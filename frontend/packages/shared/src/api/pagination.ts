import type { Paginated } from '../types/models';

/**
 * Helpers for consuming the page-based paginated envelope (`data` + `meta`).
 *
 * `useInfiniteQuery` lives in each app's queries (it needs that app's api
 * client), but the page-cursor convention is shared so both apps behave
 * identically: `initialPageParam: 1` + `getNextPageParam: nextPageParam`.
 */

/** Identity passthrough that types a raw response as a page. */
export const unwrapPage = <T>(r: Paginated<T>): Paginated<T> => r;

/** Next page number, or `undefined` on the last page (stops infinite scroll). */
export const nextPageParam = (last: Paginated<unknown>): number | undefined =>
  last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined;

/** Flatten an infinite-query's pages into a single item array. */
export const flattenPages = <T>(pages?: Paginated<T>[]): T[] =>
  (pages ?? []).flatMap((p) => p.data);
