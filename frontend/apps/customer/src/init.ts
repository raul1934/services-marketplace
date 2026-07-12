import { configureApi, configureGoogleSignIn, configureRealtime, setupWeb } from '@chamafacil/shared';
import { config } from './config';

/** Wire the shared API + realtime clients to this app's config. Call once. */
let done = false;
export function initServices() {
  if (done) return;
  done = true;
  setupWeb();
  configureApi({ baseUrl: config.apiUrl, tokenKey: config.tokenKey });
  configureRealtime({
    appKey: config.reverb.appKey,
    wsHost: config.reverb.wsHost,
    wsPort: config.reverb.wsPort,
    forceTLS: config.reverb.forceTLS,
    authBaseUrl: config.apiHost,
  });
  configureGoogleSignIn(config.googleClientId);
}
