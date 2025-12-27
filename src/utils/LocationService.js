import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

/**
 * Configuration for location requests
 */
const HIGH_ACCURACY_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000, // Wait 15s for high accuracy
  maximumAge: 10000,
};

const LOW_ACCURACY_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 10000, // Wait 10s for coarse location
  maximumAge: 10000,
};

class LocationService {
  /**
   * Request Location Permissions
   * handles both iOS and Android logic
   */
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

  /**
   * Get Current Location
   * Strategy: Try High Accuracy first -> Fail -> Try Low Accuracy
   */
  getLocation() {
    return new Promise(async (resolve, reject) => {
      // 1. Check/Request Permissions first
      const hasPermission = await this.requestPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required. Please enable it in settings.',
          [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]
        );
        return reject(new Error('PERMISSION_DENIED'));
      }

      // 2. Attempt 1: High Accuracy
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('Location success (High Accuracy)');
          resolve(position);
        },
        (error) => {
          console.warn(`High accuracy failed (${error.code}): ${error.message}`);
          
          // 3. Attempt 2: Low Accuracy (Fallback)
          console.log('Attempting low accuracy fallback...');
          this.getLowAccuracyLocation(resolve, reject);
        },
        HIGH_ACCURACY_OPTIONS
      );
    });
  }

  /**
   * Helper for Low Accuracy Fallback
   */
  getLowAccuracyLocation(resolve, reject) {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log('Location success (Low Accuracy)');
        resolve(position);
      },
      (error) => {
        console.error(`Low accuracy failed (${error.code}): ${error.message}`);
        reject(error);
      },
      LOW_ACCURACY_OPTIONS
    );
  }
}

export default new LocationService();