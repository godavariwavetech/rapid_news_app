import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { useAppUpdate } from '../hooks/useAppUpdate';

/**
 * Backend-driven update gate. Renders nothing in the common case.
 *  - status === 'forced'    -> blocking modal, no dismiss, hardware back blocked.
 *  - status === 'available' -> dismissible nudge ("Later" hides it for the session).
 */
const UpdateGate = () => {
  const { status, storeUrl, openStore } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);

  const forced = status === 'forced';

  // Block the hardware back button while a forced update is on screen.
  useEffect(() => {
    if (!forced) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [forced]);

  const visible = forced || (status === 'available' && !dismissed);
  if (!visible) return null;

  // Full-screen absolute overlay (not <Modal>) so it can't collapse: it pins to
  // all edges of the root view regardless of parent flex layout, and elevation/
  // zIndex keep it above the navigator.
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {forced ? 'Update required' : 'Update available'}
        </Text>
        <Text style={styles.body}>
          {forced
            ? 'A critical update is required to keep using RapidNews. Please update to the latest version to continue.'
            : 'A new version of RapidNews is available with the latest news and improvements.'}
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => openStore(storeUrl)}>
          <Text style={styles.primaryText}>Update now</Text>
        </TouchableOpacity>

        {!forced && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => setDismissed(true)}>
            <Text style={styles.secondaryText}>Later</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    elevation: 1000,
    zIndex: 1000,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#d11a2a',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UpdateGate;
