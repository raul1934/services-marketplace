import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { SkeletonList } from './Skeleton';
import type { Paginated } from '../types/models';
import { flattenPages } from '../api/pagination';

/** Drop items whose key was already seen, preserving order (first wins). */
function dedupeByKey<T>(items: T[], keyExtractor: (item: T, index: number) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  items.forEach((item, i) => {
    const key = keyExtractor(item, i);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });
  return out;
}

/**
 * The subset of a react-query `useInfiniteQuery` result this component needs.
 * Typed structurally so the shared package stays decoupled from react-query.
 */
export interface InfiniteListQuery<T> {
  data?: { pages: Paginated<T>[] };
  isLoading: boolean;
  /**
   * The query failed. This was missing, so a failed list fell through to the
   * empty state and told the user they had nothing — when in fact the app had
   * no idea whether they had anything.
   */
  isError?: boolean;
  isRefetching?: boolean;
  refetch?: () => void;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}

/**
 * Screen-level infinite-scroll list: a themed FlatList that flattens an
 * infinite query's pages, loads the next page as the user nears the bottom
 * (footer spinner during the fetch), supports pull-to-refresh, and shows an
 * empty state. Mirrors `Screen`'s container — safe area, themed background,
 * optional pinned `header`, and the centered ~480px phone-column cap.
 */
export function PaginatedList<T>({
  query,
  renderItem,
  keyExtractor,
  selectItems,
  header,
  listHeader,
  footer,
  empty,
  errorState,
  gap = 12,
  padded = true,
  // See Screen: the bottom edge keeps the last row clear of the nav buttons.
  edges = ['top', 'bottom'],
  contentContainerStyle,
}: {
  query: InfiniteListQuery<T>;
  renderItem: (item: T, index: number) => React.ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  /** Transform the flattened items before render (e.g. a client-side filter). */
  selectItems?: (items: T[]) => T[];
  /** Pinned header above the scroll (like `Screen stickyHeader`). */
  header?: React.ReactNode;
  /** Scrolls above the items (filter chrome, segmented tabs, summary cards…). */
  listHeader?: React.ReactElement | null;
  /** Pinned below the list, outside the scroll (e.g. an "add" button). */
  footer?: React.ReactNode;
  /** Rendered when the query resolves with zero items. */
  empty?: React.ReactElement | null;
  /**
   * Rendered instead of `empty` when the query failed and there is nothing
   * cached to show. Falls back to `empty` if the caller has not passed one,
   * which is the old behaviour — wrong, but not a regression.
   */
  errorState?: React.ReactElement | null;
  gap?: number;
  padded?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentContainerStyle?: ViewStyle;
}) {
  const t = useTheme();
  const flat = flattenPages(query.data?.pages);
  const selected = selectItems ? selectItems(flat) : flat;
  // Guard against duplicate keys: infinite-query pages can overlap when rows
  // share a sort value (e.g. two requests created in the same instant can land
  // on both page 1 and page 2), which would make FlatList render two children
  // with the same key. Keep the first occurrence of each key.
  const items = dedupeByKey(selected, keyExtractor);
  const column: ViewStyle = { width: '100%', maxWidth: 480, alignSelf: 'center' };
  const pad: ViewStyle = padded ? { paddingHorizontal: 20 } : {};

  // Only take over the whole list when there is nothing to show. Stale rows
  // beat an error card, and a failed *next page* must not wipe the pages that
  // did load — pull-to-refresh is the retry in that case.
  const failed = !!query.isError && items.length === 0;

  const onEndReached = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={edges}>
      <StatusBar barStyle="light-content" backgroundColor={t.colors.accent} />
      {header ? <View style={[{ backgroundColor: t.colors.bg }, column, pad]}>{header}</View> : null}

      {query.isLoading ? (
        <SkeletonList padded={padded} />
      ) : failed ? (
        errorState ?? empty ?? null
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={({ item, index }) => renderItem(item, index)}
          ListHeaderComponent={listHeader ?? undefined}
          ListEmptyComponent={empty ?? undefined}
          ItemSeparatorComponent={() => <View style={{ height: gap }} />}
          contentContainerStyle={[{ paddingTop: 12, paddingBottom: 32, flexGrow: 1 }, column, pad, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            query.refetch
              ? (
                <RefreshControl
                  refreshing={!!query.isRefetching}
                  onRefresh={query.refetch}
                  tintColor={t.colors.accent}
                  colors={[t.colors.accent]}
                />
              )
              : undefined
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={t.colors.accent} style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}

      {footer ? (
        <View style={[{ paddingHorizontal: padded ? 20 : 0, paddingBottom: 12 }, column]}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}
