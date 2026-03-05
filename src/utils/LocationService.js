import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const HIGH_ACCURACY_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

const LOW_ACCURACY_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 10000,
};

// Added specific options for watching position
const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  distanceFilter: 10, // Minimum distance (in meters) to trigger a location update
  interval: 5000, // Android only: Time interval (in ms) for updates
  fastestInterval: 2000, // Android only: Fastest interval for updates
};

class LocationService {
  async requestPermission() {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need access to your location to show local news.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return false;
  }

  getLocation() {
    return new Promise(async (resolve, reject) => {
      const hasPermission = await this.requestPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required. Please enable it in settings.',
          [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]
        );
        return reject(new Error('PERMISSION_DENIED'));
      }

      Geolocation.getCurrentPosition(
        (position) => {
          resolve(position);
        },
        (error) => {
          console.warn(`High accuracy failed (${error.code}): ${error.message}`);
          this.getLowAccuracyLocation(resolve, reject);
        },
        HIGH_ACCURACY_OPTIONS
      );
    });
  }

  getLowAccuracyLocation(resolve, reject) {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        console.error(`Low accuracy failed (${error.code}): ${error.message}`);
        reject(error);
      },
      LOW_ACCURACY_OPTIONS
    );
  }

  /**
   * Starts watching the user's location.
   * @param {Function} onSuccess - Callback when a new position is received.
   * @param {Function} onError - Callback when an error occurs.
   * @returns {Promise<number|null>} - Returns the watchId to be used with stopWatching, or null if permission denied.
   */
  async startWatching(onSuccess, onError) {
    const hasPermission = await this.requestPermission();

    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required. Please enable it in settings.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]
      );
      if (onError) onError(new Error('PERMISSION_DENIED'));
      return null;
    }

    const watchId = Geolocation.watchPosition(
      (position) => {
        if (onSuccess) onSuccess(position);
      },
      (error) => {
        console.warn(`Watch position failed (${error.code}): ${error.message}`);
        if (onError) onError(error);
      },
      WATCH_OPTIONS
    );

    return watchId;
  }

  /**
   * Stops watching the user's location.
   * @param {number} watchId - The ID returned by startWatching.
   */
  stopWatching(watchId) {
    if (watchId !== null && watchId !== undefined) {
      Geolocation.clearWatch(watchId);
    }
  }
}

export default new LocationService();