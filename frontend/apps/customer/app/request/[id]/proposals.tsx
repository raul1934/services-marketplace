import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Choosing a proposal now happens inline on the unified request screen while the
 * request is open. This route is kept only so existing links / notifications to
 * `/request/[id]/proposals` still resolve — it redirects to `/request/[id]`.
 */
export default function ProposalsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/request/${id}`} />;
}
