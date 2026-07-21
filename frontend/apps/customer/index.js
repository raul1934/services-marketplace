// The app's real entry point, ahead of expo-router.
//
// Both imports below register handlers that have to exist before there is any UI:
// Android starts the app *headless* to deliver a background notification or a
// Notifee event (e.g. the user swiped the ongoing "chamado em andamento" tracker
// away). Nothing under app/ is evaluated in that state, so a handler registered
// from a layout or a provider simply never runs and the event is dropped.
// i18n comes first for the same reason: the background task builds a notification
// with user-visible labels, and a headless start never reaches the layout that
// used to be the only thing importing it. Without this the tracker would fall
// back to raw keys — or, as it did before, to hardcoded Portuguese.
import './src/i18n';
import { registerActiveRequestNotificationHandler } from '@chamafacil/shared';
import './src/activeRequestBackgroundTask'; // side effect: TaskManager.defineTask
import 'expo-router/entry';

registerActiveRequestNotificationHandler();
