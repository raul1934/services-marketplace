import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * The live map + tracking now lives inline on the unified request screen.
 * This route is kept only so existing links / notifications to
 * `/request/[id]/track` still resolve — it redirects to `/request/[id]`.
 */
export default function Track() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/request/${id}`} />;
}
