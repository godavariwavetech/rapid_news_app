import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CameraComponent = ({ isVisible, onClose, onCapture }) => {
  const [isFront, setIsFront] = useState(false);
  const [flash, setFlash] = useState('off');
  const camera = useRef(null);
  const device = useCameraDevice(isFront ? 'front' : 'back');
  const insets = useSafeAreaInsets();

  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (isVisible && !hasPermission) {
      requestPermission();
    }
  }, [isVisible, hasPermission]);

  const takePhoto = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          flash: flash,
        });
        onCapture({
          uri: `file://${photo.path}`,
          type: 'image/jpeg',
          fileName: photo.path.split('/').pop(),
        });
      } catch (error) {
        console.error('Failed to take photo:', error);
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  if (!isVisible) return null;

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>No camera device found</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isVisible}
        photo={true}
      />

      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Icon name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          
          {device.hasFlash && (
            <TouchableOpacity 
              onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
              style={styles.iconButton}
            >
              <Icon
                name={flash === 'on' ? 'flash' : 'flash-off'}
                size={30}
                color="#FFF"
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={{ width: 60 }} />
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsFront(!isFront)}>
              <Icon name="camera-flip" size={30} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 22,
  },
  footer: {
    paddingBottom: 20,
  },
  footerInner: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFF',
  },
  switchButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraComponent;
