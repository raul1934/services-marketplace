// The app's real entry point, ahead of expo-router.
//
// Both imports below register handlers that have to exist before there is any UI:
// Android starts the app *headless* to deliver a background notification or a
// Notifee event (e.g. the user swiped the ongoing "chamado em andamento" tracker
// away). Nothing under app/ is evaluated in that state, so a handler registered
// from a layout or a provider simply never runs and the event is dropped.
import { registerActiveRequestNotificationHandler } from '@chamafacil/shared';
import './src/activeRequestBackgroundTask'; // side effect: TaskManager.defineTask
import 'expo-router/entry';

registerActiveRequestNotificationHandler();
