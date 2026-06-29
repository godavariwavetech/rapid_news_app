import { useEffect, useState, useCallback } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import api from '../utils/api';
import { endpoints } from '../config/config';
import { maybeStartPlayUpdate } from '../services/playInAppUpdate';

const FALLBACK_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.rapidnews';

/**
 * Update gate (Part B) + Play In-App Updates trigger (Part A).
 *
 * On launch and on each resume it asks the backend for the min/latest version
 * codes and compares them against the installed versionCode:
 *   installed < minVersionCode    -> 'forced'    (blocking, no dismiss)
 *   installed < latestVersionCode -> 'available' (dismissible nudge)
 *   otherwise                     -> 'none'
 *
 * Any failure (no network, endpoint down, non-Android) resolves to 'none' so
 * users are NEVER blocked by a failed check.
 */
export const useAppUpdate = () => {
  const [state, setState] = useState({
    status: 'none',
    storeUrl: FALLBACK_STORE_URL,
  });

  const check = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    try {
      const installed = parseInt(DeviceInfo.getBuildNumber(), 10) || 0;

      const { data } = await api.get(endpoints.APP_CONFIG, { skipAuth: true });
      const cfg = data?.data?.android || {};
      const min = Number(cfg.minVersionCode) || 0;
      const latest = Number(cfg.latestVersionCode) || 0;
      const storeUrl = cfg.storeUrl || FALLBACK_STORE_URL;

      let status = 'none';
      if (installed < min) status = 'forced';
      else if (installed < latest) status = 'available';

      setState({ status, storeUrl });

      // Part A: kick off a Play In-App Update too. IMMEDIATE for forced, FLEXIBLE
      // otherwise. Fully guarded — never throws if Play is unavailable.
      maybeStartPlayUpdate(status === 'forced');
    } catch (e) {
      // Never block the user when the check itself fails.
      console.log('[useAppUpdate] check skipped:', e?.message);
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  const openStore = useCallback(
    async (url) => {
      try {
        await Linking.openURL(url || state.storeUrl);
      } catch (e) {
        console.log('[useAppUpdate] could not open store:', e?.message);
      }
    },
    [state.storeUrl],
  );

  return { ...state, openStore };
};
