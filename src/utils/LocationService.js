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
}

export default new LocationService();