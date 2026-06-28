import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, Icon, PaginatedList, Row, ServiceRequest, Text, flattenPages, useTheme } from '@walvee/shared';
import { useMyRequests } from '../../src/queries';
import { RequestCard } from '../../src/components/RequestCard';
import { RequestFilter, RequestFilterSheet, matchesFilter } from '../../src/components/RequestFilterSheet';

export default function Requests() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const query = useMyRequests();
  const [filter, setFilter] = useState<RequestFilter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  const active = filter !== 'all';
  const matches = (r: ServiceRequest) => matchesFilter(r.status, filter);
  // Filter acts on the loaded pages (server-side filtering is a future follow-up).
  const filteredCount = useMemo(
    () => flattenPages(query.data?.pages).filter(matches).length,
    [query.data, filter],
  );

  const header = (
    <View style={{ paddingTop: 16, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text variant="h1" style={{ flex: 1 }}>{tr('requests.title')}</Text>
      <Pressable
        onPress={() => setSheetOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={tr('requests.filter')}
        accessibilityState={{ selected: active }}
        style={({ hovered }: any) => [
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            backgroundColor: active ? t.colors.accentSoft : t.colors.surface,
            borderColor: active ? t.colors.accent : t.colors.line,
          },
          t.dark ? null : t.shadowSm,
          hovered && !active ? { backgroundColor: t.colors.surface2 } : null,
        ]}
      >
        <Icon name="filter" size={20} color={active ? t.colors.accent : t.colors.ink} />
      </Pressable>
    </View>
  );

  const listHeader = active ? (
    <View style={{ gap: 8, paddingBottom: 12 }}>
      <Row style={{ flexWrap: 'wrap', gap: 8 }}>
        <FilterBadge label={tr(`requests.status.${filter}`)} onClear={() => setFilter('all')} />
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption">{tr('requests.resultCount', { count: filteredCount })}</Text>
        <Pressable onPress={() => setFilter('all')} accessibilityRole="button" hitSlop={8}>
          <Text variant="label" color={t.colors.accent}>{tr('requests.clearFilter')}</Text>
        </Pressable>
      </Row>
    </View>
  ) : null;

  const empty = active ? (
    <EmptyState
      fill
      icon="filter"
      title={tr('requests.noMatchTitle')}
      body={tr('requests.noMatchBody')}
      action={{ label: tr('requests.clearFilter'), onPress: () => setFilter('all'), variant: 'ghost' }}
    />
  ) : (
    <EmptyState
      fill
      icon="list"
      title={tr('requests.emptyTitle')}
      body={tr('requests.emptyBody')}
      action={{ label: tr('drawer.newRequest'), onPress: () => router.push('/categories'), variant: 'grad' }}
    />
  );

  return (
    <>
      <PaginatedList<ServiceRequest>
        query={query}
        selectItems={(items) => items.filter(matches)}
        keyExtractor={(r) => String(r.id)}
        renderItem={(r) => <RequestCard request={r} onPress={() => router.push(`/request/${r.id}`)} />}
        header={header}
        listHeader={listHeader}
        empty={empty}
      />

      <RequestFilterSheet
        visible={sheetOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

/** Pill showing an applied filter; tap the × to remove it. */
function FilterBadge({ label, onClear }: { label: string; onClear: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Pressable
      onPress={onClear}
      accessibilityRole="button"
      accessibilityLabel={tr('requests.clearFilter')}
      hitSlop={6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: t.colors.accentSoft,
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 6,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="caption" weight="700" color={t.colors.accent} style={{ fontSize: 12 }}>
        {label}
      </Text>
      <Icon name="close" size={13} color={t.colors.accent} />
    </Pressable>
  );
}
