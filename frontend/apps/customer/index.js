// The app's real entry point, ahead of expo-router.
//
// Notifee delivers background events (notably: the user swiped the ongoing
// "chamado em andamento" tracker away) through a headless JS task that starts the
// app with no UI at all. Nothing under app/ is evaluated in that state, so the
// handler has to be registered here — from a layout or a provider it simply never
// runs, and the event is dropped.
import { registerActiveRequestNotificationHandler } from '@chamafacil/shared';
import 'expo-router/entry';

registerActiveRequestNotificationHandler();
