import { Platform } from 'react-native';

/**
 * Google Play In-App Updates wrapper (Part A).
 *
 * Everything here is defensively wrapped: a missing Play Store, no network, an
 * older Android, or the native module not being present must NEVER throw into
 * the app. If anything is unavailable we silently no-op and let the backend
 * update gate (useAppUpdate) handle the user-facing prompt instead.
 *
 * Requires:  npm i react-native-in-app-updates   (then rebuild the Android app)
 * NOTE: Play In-App Updates only fire for builds installed FROM Play / an
 * internal-testing track with a higher versionCode live — never on a local
 * debug build. See README/handoff notes.
 */
let SpInAppUpdates;
let IAUUpdateKind;
let InstallStatus;
try {
  // eslint-disable-next-line global-require
  const lib = require('react-native-in-app-updates');
  SpInAppUpdates = lib.default;
  IAUUpdateKind = lib.IAUUpdateKind;
  InstallStatus = lib.IAUInstallStatus;
} catch (e) {
  // Library not installed yet — Play updates stay disabled, gate still works.
}

let client;
const getClient = () => {
  if (!SpInAppUpdates) return null;
  if (!client) client = new SpInAppUpdates(false); // false = quiet (no debug logs)
  return client;
};

/**
 * Check Play for an available update and start one.
 * @param {boolean} forceImmediate  true => IMMEDIATE (blocking) flow for critical
 *                                   releases; false => FLEXIBLE (background download).
 */
export const maybeStartPlayUpdate = async (forceImmediate = false) => {
  if (Platform.OS !== 'android') return;

  const inAppUpdates = getClient();
  if (!inAppUpdates) return;

  try {
    const result = await inAppUpdates.checkNeedsUpdate();
    if (!result?.shouldUpdate) return;

    if (forceImmediate) {
      await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
      return;
    }

    // FLEXIBLE: download in the background, then prompt the user to restart once
    // the download has completed.
    inAppUpdates.addStatusUpdateListener((status) => {
      const done =
        (InstallStatus && status?.status === InstallStatus.DOWNLOADED) ||
        status?.status === 11; // 11 == DOWNLOADED (Play InstallStatus fallback)
      if (done) {
        inAppUpdates.installUpdate();
      }
    });
    await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
  } catch (e) {
    // Play unavailable / user dismissed / no eligible update — never block.
    console.log('[playInAppUpdate] skipped:', e?.message);
  }
};
