import React from 'react';
import { Stack } from 'expo-router';

/** Field-service module (field_service flag). Screens share the FieldShell drawer. */
export default function FieldLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
