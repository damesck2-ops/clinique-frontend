import { ApplicationConfig } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

/**
 * Après un déploiement, un onglet resté ouvert demande des fichiers JS qui n'existent plus.
 * On recharge alors la page une fois pour récupérer la nouvelle version.
 */
function rechargerSiVersionObsolete(erreur: unknown): void {
  const message = String((erreur as { error?: unknown })?.error ?? erreur);
  if (!/dynamically imported module|Loading chunk|module script/i.test(message)) return;
  // Évite une boucle de rechargements si le fichier manque vraiment (au plus une fois par minute)
  const cle = 'rechargement-version';
  try {
    const dernier = Number(sessionStorage.getItem(cle) || 0);
    if (Date.now() - dernier < 60000) return;
    sessionStorage.setItem(cle, String(Date.now()));
  } catch { /* stockage indisponible : on recharge quand même */ }
  location.reload();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withNavigationErrorHandler(rechargerSiVersionObsolete)),
    provideAnimations(),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))
  ]
};
