/**
 * Single source of truth for native iOS permission usage descriptions, per
 * locale. Consumed by app.config.js via the with-localized-permissions plugin,
 * which sets the default (pt) strings in Info.plist and writes a localized
 * <locale>.lproj/InfoPlist.strings for each locale.
 *
 * (These are iOS-only — Android permissions have no usage-description string.)
 */
const locales = ['pt', 'en'];
const defaultLocale = 'pt';

const customer = {
  NSLocationWhenInUseUsageDescription: {
    pt: 'Usamos sua localização para encontrar prestadores próximos.',
    en: 'We use your location to find nearby providers.',
  },
  NSCameraUsageDescription: {
    pt: 'Usamos a câmera para anexar fotos ao seu chamado.',
    en: 'We use the camera to attach photos to your request.',
  },
  NSPhotoLibraryUsageDescription: {
    pt: 'Usamos suas fotos para anexar ao seu chamado.',
    en: 'We use your photos to attach to your request.',
  },
};

const provider = {
  NSLocationWhenInUseUsageDescription: {
    pt: 'Usamos sua localização para mostrar chamados próximos e atualizar sua posição ao vivo.',
    en: 'We use your location to show nearby jobs and update your live position.',
  },
  NSPhotoLibraryUsageDescription: {
    pt: 'Usamos suas fotos para enviar documentos de verificação.',
    en: 'We use your photos to upload verification documents.',
  },
};

module.exports = { locales, defaultLocale, customer, provider };
