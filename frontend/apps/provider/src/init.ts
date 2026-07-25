import { configureGoogleSignIn, setupWeb } from '@chamafacil/shared';
import { config } from './config';
import { applyApiEnv, loadApiEnv } from './apiEnv';

let done = false;
export function initServices() {
  if (done) return;
  done = true;
  setupWeb();
  // Point at the build's default (dev/localhost via .env) first, then re-apply a
  // persisted dev/prod choice once SecureStore resolves (see apiEnv.ts).
  applyApiEnv('dev');
  loadApiEnv().then((env) => {
    if (env !== 'dev') applyApiEnv(env);
  });
  configureGoogleSignIn(config.googleClientId);
}
