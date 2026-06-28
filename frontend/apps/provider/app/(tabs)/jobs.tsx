import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, PaginatedList, Segment, ServiceRequest, Text } from '@walvee/shared';
import { useMyBids, useMyJobs } from '../../src/queries';
import { JobCard } from '../../src/components/JobCard';

export default function Jobs() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [tab, setTab] = useState<'jobs' | 'bids'>('jobs');
  const jobs = useMyJobs();
  const bids = useMyBids();
  const active = tab === 'jobs' ? jobs : bids;

  const header = (
    <View style={{ gap: 14, paddingBottom: 14 }}>
      <View style={{ paddingTop: 16 }}>
        <Text variant="h1">{tr('jobs.title')}</Text>
      </View>
      <Segment
        items={[
          { value: 'jobs', label: tr('jobs.tabJobs') },
          { value: 'bids', label: tr('jobs.tabBids') },
        ]}
        value={tab}
        onChange={setTab}
      />
    </View>
  );

  return (
    <PaginatedList<ServiceRequest>
      query={active}
      keyExtractor={(r) => String(r.id)}
      header={header}
      empty={
        <EmptyState
          fill
          icon={tab === 'jobs' ? 'briefcase' : 'check'}
          title={tab === 'jobs' ? tr('jobs.emptyJobs') : tr('jobs.emptyBids')}
        />
      }
      renderItem={(r) => <JobCard request={r} onPress={() => router.push(`/job/${r.id}`)} />}
    />
  );
}
